"""
Unified delivery service that handles email and Slack
"""

import os
from typing import Dict, List, Optional
from datetime import datetime
from app.services.email_delivery_service import get_email_delivery_service
from app.services.slack_delivery_service import get_slack_delivery_service
from prisma import Prisma
import json


class DeliveryService:
    """Orchestrate delivery across multiple channels"""

    def __init__(self):
        self.email_service = get_email_delivery_service()
        self.slack_service = get_slack_delivery_service()

    async def deliver_review_results(
        self,
        scheduled_review_id: str,
        analysis_id: str,
        review_data: Dict
    ):
        """
        Deliver review results via configured channels

        Args:
            scheduled_review_id: ID of the scheduled review
            analysis_id: ID of the analysis (for web view link)
            review_data: Processed review data
        """

        prisma = Prisma()
        await prisma.connect()

        try:
            # Get scheduled review config
            scheduled_review = await prisma.scheduledreview.find_unique(
                where={"id": scheduled_review_id},
                include={"outputTemplate": True}
            )

            if not scheduled_review:
                raise Exception("Scheduled review not found")

            # Prepare template data
            template_data = self._prepare_template_data(
                scheduled_review,
                analysis_id,
                review_data
            )

            # Parse delivery channels
            try:
                if isinstance(scheduled_review.deliveryChannels, str):
                    delivery_channels = json.loads(scheduled_review.deliveryChannels)
                else:
                    delivery_channels = scheduled_review.deliveryChannels or []
            except:
                delivery_channels = []

            # Deliver via email
            print(f"📧 Checking email delivery...")
            print(f"   Delivery channels: {delivery_channels}")
            print(f"   Email recipients: {scheduled_review.emailRecipients}")
            if "email" in delivery_channels and scheduled_review.emailRecipients:
                print(f"✓ Email delivery enabled, sending...")
                await self._deliver_email(
                    scheduled_review,
                    template_data
                )
            else:
                print(f"⏭️  Email delivery skipped")

            # Deliver via Slack
            print(f"💬 Checking Slack delivery...")
            print(f"   Delivery channels: {delivery_channels}")
            print(f"   Slack webhook configured: {bool(scheduled_review.slackWebhookUrl)}")
            if "slack" in delivery_channels and scheduled_review.slackWebhookUrl:
                print(f"✓ Slack delivery enabled, sending...")
                await self._deliver_slack(
                    scheduled_review,
                    template_data
                )
            else:
                print(f"⏭️  Slack delivery skipped (channels: {delivery_channels}, webhook: {bool(scheduled_review.slackWebhookUrl)})")

            print("✅ Delivery complete")

        finally:
            await prisma.disconnect()

    def _prepare_template_data(
        self,
        scheduled_review,
        analysis_id: str,
        review_data: Dict
    ) -> Dict:
        """Prepare data for template rendering"""

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        # Extract data
        health_score = review_data.get("health_score", 0)
        total_deals = review_data.get("deals_analyzed", 0)
        ai_results = review_data.get("ai_results", {})

        pipeline_summary = ai_results.get("pipeline_summary", {}) if ai_results else {}
        top_3_risks = pipeline_summary.get("top_3_risks", [])

        # Get critical actions
        critical_actions = []
        if ai_results and "results" in ai_results:
            critical_actions = [
                {
                    "deal_name": r["deal_name"],
                    "next_action": r["next_best_action"]
                }
                for r in ai_results["results"]
                if r.get("action_priority") in ["critical", "high"]
            ][:5]

        # Calculate total pipeline value
        total_value = 0
        high_risk_count = 0

        if ai_results and "results" in ai_results:
            for r in ai_results["results"]:
                total_value += r.get("deal_amount", 0)
                if r.get("risk_level") == "high":
                    high_risk_count += 1

        # Format currency
        total_value_formatted = f"{int(total_value/1000)}K" if total_value >= 1000 else str(int(total_value))

        return {
            "review_name": scheduled_review.name,
            "current_date": datetime.now().strftime("%B %d, %Y"),
            "health_score": health_score,
            "total_deals": total_deals,
            "high_risk_count": high_risk_count,
            "total_value": total_value_formatted,
            "pipeline_summary": pipeline_summary.get("key_insight", "Your pipeline analysis is ready."),
            "top_3_risks": top_3_risks,
            "critical_actions": critical_actions,
            "view_url": f"{frontend_url}/results/{analysis_id}/ai",
            "frontend_url": frontend_url
        }

    async def _deliver_email(
        self,
        scheduled_review,
        template_data: Dict
    ):
        """Deliver via email"""

        # Get templates
        if scheduled_review.outputTemplate:
            subject_template = scheduled_review.outputTemplate.emailSubject
            body_template = scheduled_review.outputTemplate.emailTemplate
            intro_text = scheduled_review.outputTemplate.introText
            outro_text = scheduled_review.outputTemplate.outroText
        else:
            subject_template = self.email_service.get_default_subject_template()
            body_template = self.email_service.get_default_body_template()
            intro_text = None
            outro_text = None

        # Send email
        await self.email_service.send_pipeline_review(
            to_emails=scheduled_review.emailRecipients,
            subject_template=subject_template,
            body_template=body_template,
            template_data=template_data,
            intro_text=intro_text,
            outro_text=outro_text
        )

    async def _deliver_slack(
        self,
        scheduled_review,
        template_data: Dict
    ):
        """Deliver via Slack"""

        # Get template
        if scheduled_review.outputTemplate:
            slack_template = scheduled_review.outputTemplate.slackTemplate
            intro_text = scheduled_review.outputTemplate.introText
            outro_text = scheduled_review.outputTemplate.outroText
        else:
            slack_template = self.slack_service.get_default_template()
            intro_text = None
            outro_text = None

        # Send Slack message
        await self.slack_service.send_pipeline_review(
            webhook_url=scheduled_review.slackWebhookUrl,
            template=slack_template,
            template_data=template_data,
            intro_text=intro_text,
            outro_text=outro_text
        )


def get_delivery_service() -> DeliveryService:
    """Get delivery service instance"""
    return DeliveryService()
