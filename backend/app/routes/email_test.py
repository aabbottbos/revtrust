"""
Email Test Route - For debugging Resend configuration
"""

import os
import httpx
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter(prefix="/api/email-test", tags=["Email Test"])
logger = logging.getLogger(__name__)


def get_resend_api_key():
    """Get API key at runtime (after dotenv is loaded)"""
    return os.getenv("RESEND_API_KEY")


def get_from_email():
    """Get from email at runtime (after dotenv is loaded)"""
    return os.getenv("FROM_EMAIL", "notifications@revtrust.com")


class EmailTestRequest(BaseModel):
    to_email: EmailStr


class EmailTestResponse(BaseModel):
    success: bool
    message: str
    details: dict


@router.post("", response_model=EmailTestResponse)
async def send_test_email(request: EmailTestRequest):
    """
    Send a test email to verify Resend configuration.
    Includes extensive logging for debugging.
    """
    # Get config at request time (after dotenv loaded)
    resend_api_key = get_resend_api_key()
    from_email = get_from_email()

    logger.info("=" * 60)
    logger.info("EMAIL TEST - Starting test email send")
    logger.info("=" * 60)

    # Log environment configuration
    logger.info(f"[CONFIG] RESEND_API_KEY present: {bool(resend_api_key)}")
    if resend_api_key:
        # Show first/last few characters for verification
        key_preview = f"{resend_api_key[:8]}...{resend_api_key[-4:]}" if len(resend_api_key) > 12 else "***"
        logger.info(f"[CONFIG] RESEND_API_KEY preview: {key_preview}")
        logger.info(f"[CONFIG] RESEND_API_KEY length: {len(resend_api_key)}")
    else:
        logger.error("[CONFIG] RESEND_API_KEY is NOT SET!")
        return EmailTestResponse(
            success=False,
            message="RESEND_API_KEY is not configured",
            details={
                "error": "Missing API key",
                "suggestion": "Set RESEND_API_KEY in your .env file and restart the server"
            }
        )

    logger.info(f"[CONFIG] FROM_EMAIL: {from_email}")
    logger.info(f"[CONFIG] TO_EMAIL: {request.to_email}")

    # Build the email payload
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject = f"RevTrust Email Test - {timestamp}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #2563EB; font-size: 24px; margin: 0 0 16px 0;">
              Email Test Successful!
            </h1>

            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              This is a test email from RevTrust to verify your Resend configuration is working correctly.
            </p>

            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-weight: 600;">
                Configuration Details:
              </p>
              <ul style="color: #166534; margin: 8px 0 0 0; padding-left: 20px;">
                <li>From: {from_email}</li>
                <li>To: {request.to_email}</li>
                <li>Sent at: {timestamp}</li>
              </ul>
            </div>

            <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
              If you received this email, your Resend integration is working correctly.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    payload = {
        "from": from_email,
        "to": [request.to_email],
        "subject": subject,
        "html": html_content
    }

    logger.info("[PAYLOAD] Building email payload...")
    logger.info(f"[PAYLOAD] From: {payload['from']}")
    logger.info(f"[PAYLOAD] To: {payload['to']}")
    logger.info(f"[PAYLOAD] Subject: {payload['subject']}")
    logger.info(f"[PAYLOAD] HTML length: {len(html_content)} characters")

    # Make the API request
    logger.info("[API] Preparing to call Resend API...")
    logger.info("[API] Endpoint: https://api.resend.com/emails")
    logger.info("[API] Method: POST")

    try:
        logger.info("[API] Creating HTTP client...")
        async with httpx.AsyncClient() as client:
            logger.info("[API] Sending request to Resend...")

            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )

            logger.info(f"[RESPONSE] Status code: {response.status_code}")
            logger.info(f"[RESPONSE] Headers: {dict(response.headers)}")

            response_text = response.text
            logger.info(f"[RESPONSE] Body: {response_text}")

            if response.status_code == 200:
                logger.info("[SUCCESS] Email sent successfully!")
                logger.info("=" * 60)
                return EmailTestResponse(
                    success=True,
                    message=f"Test email sent successfully to {request.to_email}",
                    details={
                        "status_code": response.status_code,
                        "response": response.json() if response_text else {},
                        "from_email": from_email,
                        "to_email": request.to_email,
                        "timestamp": timestamp
                    }
                )
            else:
                logger.error(f"[ERROR] Resend API returned error: {response.status_code}")
                logger.error(f"[ERROR] Response body: {response_text}")
                logger.info("=" * 60)

                # Parse error details if available
                error_details = {}
                try:
                    error_details = response.json()
                except:
                    error_details = {"raw_response": response_text}

                return EmailTestResponse(
                    success=False,
                    message=f"Resend API error: {response.status_code}",
                    details={
                        "status_code": response.status_code,
                        "error": error_details,
                        "from_email": from_email,
                        "to_email": request.to_email,
                        "common_issues": get_common_issues(response.status_code, error_details)
                    }
                )

    except httpx.TimeoutException as e:
        logger.error(f"[ERROR] Request timed out: {e}")
        logger.info("=" * 60)
        return EmailTestResponse(
            success=False,
            message="Request timed out",
            details={
                "error": "timeout",
                "suggestion": "Check your network connection and try again"
            }
        )
    except httpx.RequestError as e:
        logger.error(f"[ERROR] Request error: {e}")
        logger.info("=" * 60)
        return EmailTestResponse(
            success=False,
            message=f"Request error: {str(e)}",
            details={
                "error": str(e),
                "error_type": type(e).__name__,
                "suggestion": "Check your network connection"
            }
        )
    except Exception as e:
        logger.exception(f"[ERROR] Unexpected error: {e}")
        logger.info("=" * 60)
        return EmailTestResponse(
            success=False,
            message=f"Unexpected error: {str(e)}",
            details={
                "error": str(e),
                "error_type": type(e).__name__
            }
        )


@router.get("/config")
async def get_email_config():
    """
    Check email configuration status (no sensitive data exposed)
    """
    # Get config at request time
    resend_api_key = get_resend_api_key()
    from_email = get_from_email()

    logger.info("[CONFIG CHECK] Checking email configuration...")

    config = {
        "resend_api_key_configured": bool(resend_api_key),
        "from_email": from_email,
        "api_key_length": len(resend_api_key) if resend_api_key else 0,
        "api_key_starts_with": resend_api_key[:4] + "..." if resend_api_key and len(resend_api_key) > 4 else None
    }

    logger.info(f"[CONFIG CHECK] Result: {config}")
    return config


def get_common_issues(status_code: int, error_details: dict) -> list:
    """Return common issues based on error code"""
    issues = []

    if status_code == 401:
        issues.append("Invalid API key - check that RESEND_API_KEY is correct")
        issues.append("API key may have been revoked or expired")
    elif status_code == 403:
        issues.append("Forbidden - check domain verification in Resend dashboard")
        issues.append("FROM_EMAIL domain may not be verified")
    elif status_code == 422:
        issues.append("Invalid request - check email addresses are valid")
        issues.append("FROM_EMAIL may be using an unverified domain")
    elif status_code == 429:
        issues.append("Rate limited - too many requests")
        issues.append("Wait a moment and try again")
    elif status_code >= 500:
        issues.append("Resend server error - try again later")

    return issues
