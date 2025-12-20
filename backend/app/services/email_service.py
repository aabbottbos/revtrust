"""
Simple email service using Resend or SendGrid
"""

import os
import httpx
from typing import Optional

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "notifications@revtrust.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


async def send_analysis_complete_email(
    to_email: str,
    analysis_id: str,
    health_score: int,
    total_deals: int,
    issues_count: int
):
    """Send email when analysis completes"""

    if not RESEND_API_KEY:
        print("⚠️  RESEND_API_KEY not configured, skipping email")
        return

    subject = f"Your RevTrust Analysis is Ready - Health Score: {health_score}/100"

    html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #2563EB; font-size: 28px; margin: 0;">RevTrust</h1>
            <p style="color: #64748b; margin: 8px 0 0 0;">Pipeline Health Analysis</p>
          </div>

          <!-- Main Card -->
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
              Your Pipeline Analysis is Complete ✓
            </h2>

            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
              We've analyzed {total_deals} deals in your pipeline. Here's what we found:
            </p>

            <!-- Metrics -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="margin-bottom: 16px;">
                <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Health Score</div>
                <div style="color: #0f172a; font-size: 32px; font-weight: bold;">{health_score}/100</div>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Issues Found</div>
                <div style="color: #0f172a; font-size: 24px; font-weight: bold;">{issues_count}</div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="{FRONTEND_URL}/results/{analysis_id}"
                 style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Full Results
              </a>
            </div>

            <!-- Upgrade Prompt -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px 0;">
                <strong>Want AI-powered insights for each deal?</strong>
              </p>
              <a href="{FRONTEND_URL}/pricing"
                 style="color: #2563EB; text-decoration: none; font-weight: 600; font-size: 14px;">
                Upgrade to Pro →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">
              Questions? Just reply to this email.
            </p>
            <p style="margin: 0;">
              © 2024 RevTrust. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "html": html
                },
                timeout=10.0
            )

            if response.status_code == 200:
                print(f"✓ Email sent to {to_email}")
                return True
            else:
                print(f"Email error: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        print(f"Email error: {e}")
        return False


async def send_ai_analysis_complete_email(
    to_email: str,
    analysis_id: str,
    high_risk_count: int,
    total_deals: int
):
    """Send email when AI analysis completes"""

    if not RESEND_API_KEY:
        print("⚠️  RESEND_API_KEY not configured, skipping email")
        return

    subject = f"AI Analysis Complete - {high_risk_count} High-Risk Deals Identified"

    html = f"""
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #2563EB; font-size: 28px; margin: 0;">RevTrust AI</h1>
          </div>

          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
              AI Analysis Complete 🤖
            </h2>

            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
              Our AI has analyzed {total_deals} deals and identified priority actions.
            </p>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="color: #991b1b; font-weight: 600; margin-bottom: 8px;">
                ⚠️ {high_risk_count} High-Risk Deals Require Attention
              </div>
              <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
                These deals have significant risk factors that could impact your forecast.
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="{FRONTEND_URL}/results/{analysis_id}/ai"
                 style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View AI Insights
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px;">
            <p style="margin: 0;">© 2024 RevTrust. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "html": html
                },
                timeout=10.0
            )

            if response.status_code == 200:
                print(f"✓ AI analysis email sent to {to_email}")
                return True
            else:
                print(f"Email error: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        print(f"Email error: {e}")
        return False


async def send_invitation_email(
    to_email: str,
    org_name: str,
    inviter_name: str,
    invite_token: str,
    role: str = "member"
):
    """Send organization invitation email"""

    if not RESEND_API_KEY:
        print("⚠️  RESEND_API_KEY not configured, skipping email")
        return

    invite_url = f"{FRONTEND_URL}/invite?token={invite_token}"
    subject = f"You've been invited to join {org_name} on RevTrust"

    html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #2563EB; font-size: 28px; margin: 0;">RevTrust</h1>
            <p style="color: #64748b; margin: 8px 0 0 0;">Team Invitation</p>
          </div>

          <!-- Main Card -->
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #0f172a; font-size: 24px; margin: 0 0 16px 0;">
              You're Invited! 🎉
            </h2>

            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
              <strong>{inviter_name}</strong> has invited you to join <strong>{org_name}</strong> on RevTrust as a <strong>{role}</strong>.
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
              RevTrust helps sales teams analyze their pipeline health and improve forecast accuracy.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="{invite_url}"
                 style="display: inline-block; background: #2563EB; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 14px; text-align: center;">
              This invitation will expire in 7 days.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <p style="margin: 0;">
              © 2024 RevTrust. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "html": html
                },
                timeout=10.0
            )

            if response.status_code == 200:
                print(f"✓ Invitation email sent to {to_email}")
                return True
            else:
                print(f"Email error: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        print(f"Email error: {e}")
        return False
