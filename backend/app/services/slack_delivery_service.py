"""
Slack delivery service with templating
"""

import requests
from jinja2 import Environment
from typing import Dict, Optional


def format_number(value):
    """Format number with commas"""
    return f"{int(value):,}"


class SlackDeliveryService:
    """Handle Slack message delivery with templating"""

    def __init__(self):
        self.env = Environment()
        self.env.filters['format_number'] = format_number

    async def send_simple_notification(
        self,
        webhook_url: str,
        message: str
    ) -> bool:
        """
        Send a simple text notification to Slack

        Args:
            webhook_url: Slack webhook URL
            message: Plain text message to send
        """

        print(f"📨 Sending simple notification to Slack...")

        try:
            response = requests.post(
                webhook_url,
                json={"text": message},
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                print(f"✅ Slack notification sent successfully")
                return True
            else:
                print(f"❌ Slack send failed: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ Slack send failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def send_pipeline_review(
        self,
        webhook_url: str,
        template: str,
        template_data: Dict,
        intro_text: Optional[str] = None,
        outro_text: Optional[str] = None
    ) -> bool:
        """
        Send pipeline review to Slack

        Args:
            webhook_url: Slack webhook URL
            template: Message template with variables
            template_data: Data to inject into template
            intro_text: Custom intro text
            outro_text: Custom outro text
        """

        print(f"📨 Sending pipeline review to Slack...")
        print(f"   Webhook URL: {webhook_url[:50]}..." if len(webhook_url) > 50 else f"   Webhook URL: {webhook_url}")
        print(f"   Health Score: {template_data.get('health_score')}")
        print(f"   Total Deals: {template_data.get('total_deals')}")

        try:
            # Render template
            print(f"🔄 Rendering Slack message template...")
            message = self.env.from_string(template).render(
                intro_text=intro_text,
                outro_text=outro_text,
                **template_data
            )
            print(f"✓ Template rendered ({len(message)} characters)")
            print(f"   Preview: {message[:100]}...")

            # Send to Slack
            print(f"📤 Posting to Slack webhook...")
            response = requests.post(
                webhook_url,
                json={"text": message},
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                print(f"✅ Slack message sent successfully")
                return True
            else:
                print(f"❌ Slack send failed: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"❌ Slack send failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    def get_default_template(self) -> str:
        """Get default Slack message template"""
        return """{% if intro_text %}
{{ intro_text }}

{% endif %}🤖 *Your Pipeline Review is Ready*

📊 *{{ review_name }}* • {{ current_date }}

*Executive Summary*
{{ pipeline_summary }}

*Key Metrics*
• Health Score: *{{ health_score }}/100* {% if health_score < 60 %}⚠️{% elif health_score < 80 %}✓{% else %}✅{% endif %}
• Total Deals: {{ total_deals }} (${{ total_value }})
• High Risk: *{{ high_risk_count }} deals* need attention

*🚨 Top 3 At-Risk Deals*
{% for deal in top_3_risks %}
{{ loop.index }}. *{{ deal.deal_name }}* (${{ deal.deal_value|int|format_number }}) - Risk: {{ deal.risk_score }}/100
   └ {{ deal.why_at_risk }}
   💬 _Defense: "{{ deal.defense_talking_point }}"_
{% endfor %}

*⚡ Critical Actions Today*
{% for action in critical_actions[:5] %}
• *{{ action.deal_name }}:* {{ action.next_action }}
{% endfor %}
{% if outro_text %}

{{ outro_text }}
{% endif %}

<{{ view_url }}|View Full Report> • <{{ frontend_url }}/scheduled-reviews|Manage Schedule>
"""


def get_slack_delivery_service() -> SlackDeliveryService:
    """Get Slack delivery service instance"""
    return SlackDeliveryService()
