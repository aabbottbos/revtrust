"""
Routes for managing output templates
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from jinja2 import Environment
from prisma import Prisma
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/templates", tags=["Templates"])


class CreateTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    email_subject: str
    email_template: str
    slack_template: str
    intro_text: Optional[str] = None
    outro_text: Optional[str] = None


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email_subject: Optional[str] = None
    email_template: Optional[str] = None
    slack_template: Optional[str] = None
    intro_text: Optional[str] = None
    outro_text: Optional[str] = None


@router.post("")
async def create_template(
    request: CreateTemplateRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new output template"""

    prisma = Prisma()
    await prisma.connect()

    try:
        template = await prisma.outputtemplate.create(
            data={
                "userId": user_id,
                "name": request.name,
                "description": request.description,
                "emailSubject": request.email_subject,
                "emailTemplate": request.email_template,
                "slackTemplate": request.slack_template,
                "introText": request.intro_text,
                "outroText": request.outro_text
            }
        )

        return {
            "id": template.id,
            "name": template.name,
            "created_at": template.createdAt.isoformat()
        }

    finally:
        await prisma.disconnect()


@router.get("")
async def list_templates(
    user_id: str = Depends(get_current_user_id)
):
    """List user's templates"""

    prisma = Prisma()
    await prisma.connect()

    try:
        templates = await prisma.outputtemplate.find_many(
            where={"userId": user_id},
            order={"createdAt": "desc"}
        )

        return {
            "templates": [
                {
                    "id": t.id,
                    "name": t.name,
                    "description": t.description,
                    "is_default": t.isDefault,
                    "created_at": t.createdAt.isoformat()
                }
                for t in templates
            ]
        }

    finally:
        await prisma.disconnect()


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific template"""

    prisma = Prisma()
    await prisma.connect()

    try:
        template = await prisma.outputtemplate.find_unique(
            where={"id": template_id}
        )

        if not template or template.userId != user_id:
            raise HTTPException(404, "Template not found")

        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "email_subject": template.emailSubject,
            "email_template": template.emailTemplate,
            "slack_template": template.slackTemplate,
            "intro_text": template.introText,
            "outro_text": template.outroText,
            "is_default": template.isDefault,
            "created_at": template.createdAt.isoformat()
        }

    finally:
        await prisma.disconnect()


@router.get("/defaults/email")
async def get_default_email_template():
    """Get default email template"""

    from app.services.email_delivery_service import get_email_delivery_service

    service = get_email_delivery_service()

    return {
        "subject": service.get_default_subject_template(),
        "body": service.get_default_body_template()
    }


@router.get("/defaults/slack")
async def get_default_slack_template():
    """Get default Slack template"""

    from app.services.slack_delivery_service import get_slack_delivery_service

    service = get_slack_delivery_service()

    return {
        "template": service.get_default_template()
    }


@router.post("/preview")
async def preview_template(
    email_subject: str,
    email_template: str,
    slack_template: str,
    user_id: str = Depends(get_current_user_id)
):
    """Preview a template with sample data"""

    # Sample data
    sample_data = {
        "review_name": "Weekly Pipeline Review",
        "current_date": "December 4, 2025",
        "health_score": 68,
        "total_deals": 47,
        "high_risk_count": 8,
        "total_value": "2.3M",
        "pipeline_summary": "Your pipeline has concerning patterns with 8 high-risk deals requiring immediate attention.",
        "top_3_risks": [
            {
                "deal_name": "GlobalCo - Integration",
                "deal_value": 200000,
                "risk_score": 92,
                "why_at_risk": "Close date passed 18 days ago with no recent activity",
                "defense_talking_point": "Emphasizing ongoing discovery with new stakeholder group"
            },
            {
                "deal_name": "Acme Corp - Enterprise",
                "deal_value": 150000,
                "risk_score": 68,
                "why_at_risk": "14 days no activity in negotiation stage",
                "defense_talking_point": "Contract in legal review, expecting response this week"
            }
        ],
        "critical_actions": [
            {"deal_name": "GlobalCo", "next_action": "Call Jane Smith to salvage $200K opportunity"},
            {"deal_name": "Acme", "next_action": "Schedule executive briefing by EOD"}
        ],
        "view_url": "https://revtrust.com/results/123/ai",
        "frontend_url": "https://revtrust.com"
    }

    try:
        # Create environment with filters
        env = Environment()
        env.filters['format_number'] = lambda x: f"{int(x):,}"

        # Render templates
        email_subject_rendered = env.from_string(email_subject).render(**sample_data)
        email_body_rendered = env.from_string(email_template).render(**sample_data)
        slack_rendered = env.from_string(slack_template).render(**sample_data)

        return {
            "email_subject": email_subject_rendered,
            "email_body": email_body_rendered,
            "slack_message": slack_rendered
        }

    except Exception as e:
        raise HTTPException(400, f"Template rendering error: {str(e)}")


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a template"""

    prisma = Prisma()
    await prisma.connect()

    try:
        template = await prisma.outputtemplate.find_unique(
            where={"id": template_id}
        )

        if not template or template.userId != user_id:
            raise HTTPException(404, "Template not found")

        await prisma.outputtemplate.delete(
            where={"id": template_id}
        )

        return {"status": "deleted"}

    finally:
        await prisma.disconnect()
