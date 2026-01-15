"""
AI Email Template Generation
Generates contextual email templates for sales follow-ups
"""

import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import anthropic

from app.auth import get_current_user_id
from app.services.subscription_service import get_subscription_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/email-template", tags=["AI Email"])


class EmailTemplateRequest(BaseModel):
    deal_id: Optional[str] = None
    analysis_id: Optional[str] = None
    template_type: str = "follow_up"  # follow_up, check_in, re_engagement, proposal
    tone: str = "professional"  # professional, friendly, urgent


class EmailTemplateResponse(BaseModel):
    subject: str
    body: str
    personalization_data: dict


@router.post("", response_model=EmailTemplateResponse)
async def generate_email_template(
    request: EmailTemplateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate AI-powered email template for sales outreach
    Requires Pro subscription
    """

    # Check subscription
    subscription_service = get_subscription_service()
    has_access = await subscription_service.check_ai_access(user_id)

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="AI email templates require Pro subscription. Upgrade at /pricing"
        )

    # Get deal context
    deal_context = ""
    personalization_data = {}

    if request.deal_id and request.analysis_id:
        deal_context, personalization_data = await _get_deal_context(
            request.analysis_id,
            request.deal_id,
            user_id
        )

    # Build prompt
    prompt = _build_email_prompt(
        template_type=request.template_type,
        tone=request.tone,
        deal_context=deal_context,
        personalization_data=personalization_data
    )

    # Call Claude API
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        response = client.messages.create(
            model=os.getenv("AI_MODEL", "claude-sonnet-4-20250514"),
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        email_text = response.content[0].text

        # Parse subject and body
        subject, body = _parse_email(email_text)

        return EmailTemplateResponse(
            subject=subject,
            body=body,
            personalization_data=personalization_data
        )

    except Exception as e:
        logger.error(f"Email generation error: {e}", exc_info=True)
        raise HTTPException(500, f"Email generation failed: {str(e)}")


async def _get_deal_context(analysis_id: str, deal_id: str, user_id: str):
    """Get deal context for email personalization"""
    from app.routes.analyze import analysis_status_store
    from app.routes.ai_analysis import ai_analysis_store

    personalization_data = {
        "recipient_name": "there",  # Default
        "company": "your company",
        "deal_value": "$0",
        "deal_name": "this opportunity"
    }

    deal_context = ""

    if analysis_id in analysis_status_store:
        analysis = analysis_status_store[analysis_id]

        # Try CRM scan format
        if "deals_summary" in analysis:
            deals_summary = analysis.get("deals_summary", [])
            deal = next((d for d in deals_summary if d.get("deal_id") == deal_id), None)

            if deal:
                personalization_data["deal_name"] = deal.get("deal_name", "this opportunity")
                personalization_data["company"] = deal.get("account_name", "your company")
                personalization_data["deal_value"] = f"${deal.get('amount', 0):,.0f}"

                deal_context = f"""
DEAL INFORMATION:
- Name: {deal.get('deal_name')}
- Company: {deal.get('account_name')}
- Value: ${deal.get('amount', 0):,.2f}
- Stage: {deal.get('stage')}
- Close Date: {deal.get('close_date')}
"""

                # Get violations
                violations = analysis.get("violations", [])
                deal_violations = [v for v in violations if v.get("deal_id") == deal_id]

                if deal_violations:
                    deal_context += f"\nKEY ISSUES:\n"
                    for v in deal_violations[:3]:
                        deal_context += f"- {v.get('message')}\n"

        # Try file upload format
        else:
            result = analysis.get("result", {})
            deals = result.get("deals", [])
            deal = next((d for d in deals if d.get("id") == deal_id), None)

            if deal:
                personalization_data["deal_name"] = deal.get("name", "this opportunity")
                personalization_data["company"] = deal.get("account", "your company")
                personalization_data["deal_value"] = f"${deal.get('amount', 0):,.0f}"

    # Get AI insights if available
    if analysis_id in ai_analysis_store:
        ai_data = ai_analysis_store[analysis_id]
        results = ai_data.get("results", [])
        deal_ai = next((r for r in results if r.get("deal_id") == deal_id), None)

        if deal_ai:
            deal_context += f"""
AI INSIGHTS:
- Recommended Action: {deal_ai.get('next_best_action')}
- Risk Factors: {', '.join(deal_ai.get('risk_factors', [])[:2])}
"""

    return deal_context, personalization_data


def _build_email_prompt(template_type: str, tone: str, deal_context: str, personalization_data: dict) -> str:
    """Build prompt for email generation"""

    tone_guidance = {
        "professional": "Professional and polished, suitable for enterprise buyers",
        "friendly": "Warm and approachable, building rapport while remaining professional",
        "urgent": "Creates appropriate sense of urgency without being pushy"
    }

    template_guidance = {
        "follow_up": "Following up after a previous interaction (demo, call, proposal)",
        "check_in": "Checking in on a deal that's been quiet or stalled",
        "re_engagement": "Re-engaging a deal that went cold or lost momentum",
        "proposal": "Sending a proposal or next steps after initial conversations"
    }

    prompt = f"""You are an expert B2B sales email writer. Write a compelling sales email with the following parameters:

TYPE: {template_type} - {template_guidance.get(template_type, 'General sales email')}
TONE: {tone} - {tone_guidance.get(tone, 'Professional')}

{deal_context if deal_context else "GENERAL CONTEXT: No specific deal information provided. Write a general template."}

REQUIREMENTS:
1. Subject line: Compelling, specific, under 60 characters
2. Opening: Personal and relevant to recipient's situation
3. Body:
   - 2-3 short paragraphs maximum
   - Reference specific pain points or context from deal data
   - Include clear value proposition
   - Specific call-to-action
4. Closing: Professional but warm
5. Tone: {tone}

STYLE GUIDELINES:
- Use recipient's name ('[Recipient Name]' as placeholder if unknown)
- Mention specific details from the deal if available
- Focus on THEIR business outcomes, not YOUR product features
- Keep it scannable (short paragraphs, bullets if needed)
- No fluff or empty platitudes
- One clear ask/next step

FORMAT:
Subject: [write subject line here]

[Write email body here]

Write the email now:"""

    return prompt


def _parse_email(email_text: str) -> tuple[str, str]:
    """Parse subject and body from AI response"""

    lines = email_text.strip().split('\n')
    subject = ""
    body_lines = []
    found_subject = False

    for line in lines:
        if line.strip().startswith("Subject:"):
            subject = line.replace("Subject:", "").strip()
            found_subject = True
        elif found_subject:
            body_lines.append(line)

    body = '\n'.join(body_lines).strip()

    # Fallback if parsing fails
    if not subject:
        subject = "Following up on our conversation"

    if not body:
        body = email_text

    return subject, body
