"""
Contact sales form routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_contact_sales_email
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contact", tags=["Contact"])


class ContactSalesRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    company: str
    role: str
    teamSize: str
    message: str


@router.post("/sales")
async def submit_contact_sales(request: ContactSalesRequest):
    """Handle contact sales form submission"""

    try:
        # Send email to sales@revtrust.net
        success = await send_contact_sales_email(
            name=request.name,
            email=request.email,
            phone=request.phone,
            company=request.company,
            role=request.role,
            team_size=request.teamSize,
            message=request.message
        )

        if success:
            logger.info(f"Contact sales form submitted by {request.email} from {request.company}")
            return {
                "status": "success",
                "message": "Thank you for your inquiry. Our sales team will contact you within 24 hours."
            }
        else:
            logger.error(f"Failed to send contact sales email for {request.email}")
            raise HTTPException(
                status_code=500,
                detail="Failed to send email. Please try again or contact us directly at sales@revtrust.net"
            )

    except Exception as e:
        logger.error(f"Error processing contact sales form: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred. Please try again or contact us directly at sales@revtrust.net"
        )
