"""
AI Deal Coaching Chat
Provides contextual coaching and advice for sales reps
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import anthropic

from app.auth import get_current_user_id
from app.services.subscription_service import get_subscription_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai/chat", tags=["AI Chat"])

# In-memory conversation storage (TODO: move to Redis/DB)
conversation_store: Dict[str, List[Dict[str, Any]]] = {}


class ChatMessage(BaseModel):
    message: str
    deal_id: Optional[str] = None
    analysis_id: Optional[str] = None
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    suggestions: List[str]
    timestamp: str


@router.post("", response_model=ChatResponse)
async def chat_with_ai_coach(
    chat_message: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat with AI deal coach for personalized sales advice
    Requires Pro subscription
    """

    # Check subscription
    subscription_service = get_subscription_service()
    has_access = await subscription_service.check_ai_access(user_id)

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="AI coaching requires Pro subscription. Upgrade at /pricing"
        )

    # Get or create conversation
    conversation_id = chat_message.conversation_id or str(uuid.uuid4())

    if conversation_id not in conversation_store:
        conversation_store[conversation_id] = []

    # Get deal context if provided
    deal_context = ""
    if chat_message.deal_id and chat_message.analysis_id:
        deal_context = await _get_deal_context(
            chat_message.analysis_id,
            chat_message.deal_id,
            user_id
        )

    # Build conversation history
    messages = []

    # System prompt with deal context
    system_prompt = _build_system_prompt(deal_context)

    # Add conversation history
    for msg in conversation_store[conversation_id]:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Add current user message
    messages.append({
        "role": "user",
        "content": chat_message.message
    })

    # Call Claude API
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        response = client.messages.create(
            model=os.getenv("AI_MODEL", "claude-sonnet-4-20250514"),
            max_tokens=2000,
            system=system_prompt,
            messages=messages
        )

        ai_response = response.content[0].text

        # Store conversation
        conversation_store[conversation_id].append({
            "role": "user",
            "content": chat_message.message,
            "timestamp": datetime.utcnow().isoformat()
        })
        conversation_store[conversation_id].append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Extract suggestions (if AI provided bullet points)
        suggestions = _extract_suggestions(ai_response)

        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            suggestions=suggestions,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(500, f"Chat failed: {str(e)}")


@router.delete("/{conversation_id}")
async def clear_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Clear conversation history"""
    if conversation_id in conversation_store:
        del conversation_store[conversation_id]

    return {"success": True, "message": "Conversation cleared"}


async def _get_deal_context(analysis_id: str, deal_id: str, user_id: str) -> str:
    """
    Get deal context from analysis results
    """
    from app.routes.analyze import analysis_status_store
    from app.routes.ai_analysis import ai_analysis_store

    logger.info(f"Getting deal context for analysis={analysis_id}, deal={deal_id}")
    context_parts = []

    # Get base analysis
    if analysis_id in analysis_status_store:
        analysis = analysis_status_store[analysis_id]

        # Find the specific deal
        deals = []
        violations = []

        # Try file upload format
        result = analysis.get("result", {})
        deals = result.get("deals", [])
        violations = result.get("violations", [])

        # Try CRM scan format
        if not deals and "deals_summary" in analysis:
            deals_summary = analysis.get("deals_summary", [])
            violations = analysis.get("violations", [])

            # Find deal in summary
            deal = next((d for d in deals_summary if d.get("deal_id") == deal_id), None)
            if deal:
                context_parts.append(f"DEAL: {deal.get('deal_name', 'Unknown')}")
                context_parts.append(f"Amount: ${deal.get('amount', 0):,.2f}")
                context_parts.append(f"Stage: {deal.get('stage', 'Unknown')}")
                context_parts.append(f"Close Date: {deal.get('close_date', 'Not set')}")
                context_parts.append(f"Account: {deal.get('account_name', 'Unknown')}")
        else:
            # Find deal in full deals array
            deal = next((d for d in deals if d.get("id") == deal_id), None)
            if deal:
                context_parts.append(f"DEAL: {deal.get('name', 'Unknown')}")
                context_parts.append(f"Amount: ${deal.get('amount', 0):,.2f}")
                context_parts.append(f"Stage: {deal.get('stage', 'Unknown')}")
                context_parts.append(f"Close Date: {deal.get('close_date', 'Not set')}")

        # Get violations for this deal
        deal_violations = [v for v in violations if v.get("deal_id") == deal_id]
        if deal_violations:
            context_parts.append(f"\nISSUES FOUND ({len(deal_violations)}):")
            for v in deal_violations[:5]:  # Max 5 violations
                severity = v.get("severity", "INFO")
                message = v.get("message", "")
                context_parts.append(f"  [{severity}] {message}")

    # Get AI analysis if available
    if analysis_id in ai_analysis_store:
        ai_data = ai_analysis_store[analysis_id]
        results = ai_data.get("results", [])

        deal_ai = next((r for r in results if r.get("deal_id") == deal_id), None)
        if deal_ai:
            context_parts.append(f"\nAI ANALYSIS:")
            context_parts.append(f"Risk Score: {deal_ai.get('risk_score', 0)}/100")
            context_parts.append(f"Risk Level: {deal_ai.get('risk_level', 'unknown').upper()}")
            context_parts.append(f"Recommended Action: {deal_ai.get('next_best_action', 'N/A')}")

            risk_factors = deal_ai.get('risk_factors', [])
            if risk_factors:
                context_parts.append(f"Risk Factors:")
                for rf in risk_factors:
                    context_parts.append(f"  - {rf}")

    return "\n".join(context_parts) if context_parts else "No deal context available"


def _build_system_prompt(deal_context: str) -> str:
    """Build system prompt for AI coach"""

    base_prompt = """You are an elite B2B sales coach with 20 years of experience helping sales reps close complex enterprise deals. You provide direct, actionable advice based on deal data and sales best practices.

Your coaching style:
- Be specific and actionable (not generic advice)
- Reference the actual deal data when giving advice
- Provide 2-3 concrete next steps
- Be encouraging but honest about risks
- Use sales terminology the rep will understand
- Keep responses concise (2-3 paragraphs max)

When a rep asks for help:
1. Acknowledge what they're dealing with
2. Reference specific data points (amount, stage, time in stage, etc.)
3. Give 2-3 specific actions they can take in the next 24-48 hours
4. Explain WHY each action will move the deal forward

Avoid:
- Generic advice like "follow up" or "build rapport"
- Long-winded explanations
- Jargon or buzzwords
- Negativity (be constructive)"""

    if deal_context:
        base_prompt += f"\n\nCURRENT DEAL CONTEXT:\n{deal_context}"
    else:
        base_prompt += "\n\nNo specific deal selected. Provide general sales coaching advice."

    return base_prompt


def _extract_suggestions(response: str) -> List[str]:
    """Extract bullet points or numbered items from AI response"""
    suggestions = []
    lines = response.split('\n')

    for line in lines:
        line = line.strip()
        # Match bullet points or numbered lists
        if line.startswith(('- ', '* ', '• ')) or (len(line) > 2 and line[0].isdigit() and line[1] in ('.', ')')):
            # Clean up the suggestion
            clean = line.lstrip('-*•0123456789. )')
            if clean:
                suggestions.append(clean)

    return suggestions[:5]  # Max 5 suggestions
