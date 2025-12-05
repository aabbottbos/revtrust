"""
Email delivery service with templating
"""

import os
import resend
from jinja2 import Environment
from typing import Dict, List, Optional
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "reviews@revtrust.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def format_number(value):
    """Format number with commas"""
    return f"{int(value):,}"


class EmailDeliveryService:
    """Handle email delivery with templating"""

    def __init__(self):
        self.from_email = FROM_EMAIL
        self.env = Environment()
        self.env.filters['format_number'] = format_number

    async def send_pipeline_review(
        self,
        to_emails: List[str],
        subject_template: str,
        body_template: str,
        template_data: Dict,
        intro_text: Optional[str] = None,
        outro_text: Optional[str] = None
    ) -> bool:
        """
        Send pipeline review email

        Args:
            to_emails: List of recipient emails
            subject_template: Subject line with variables
            body_template: HTML body template with variables
            template_data: Data to inject into templates
            intro_text: Custom intro text
            outro_text: Custom outro text
        """

        try:
            # Render subject
            subject = self.env.from_string(subject_template).render(**template_data)

            # Render body
            body_html = self.env.from_string(body_template).render(
                intro_text=intro_text,
                outro_text=outro_text,
                **template_data
            )

            # Send email
            params = {
                "from": self.from_email,
                "to": to_emails,
                "subject": subject,
                "html": body_html
            }

            result = resend.Emails.send(params)

            print(f"✅ Email sent to {', '.join(to_emails)}")
            print(f"   Subject: {subject}")
            print(f"   Email ID: {result['id']}")

            return True

        except Exception as e:
            print(f"❌ Email send failed: {e}")
            return False

    def get_default_subject_template(self) -> str:
        """Get default email subject template"""
        return "Pipeline Review: {{health_score}}/100 Health Score ({{high_risk_count}} deals need attention)"

    def get_default_body_template(self) -> str:
        """Get default email body template"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .summary-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .summary-box h3 {
            margin: 0 0 10px 0;
            color: #667eea;
        }
        .metrics {
            display: table;
            width: 100%;
            margin: 20px 0;
        }
        .metric {
            display: table-cell;
            text-align: center;
            padding: 15px;
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .risk-deal {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        .risk-deal h4 {
            margin: 0 0 10px 0;
            color: #d32f2f;
        }
        .risk-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .risk-high { background: #ffebee; color: #d32f2f; }
        .risk-medium { background: #fff3e0; color: #f57c00; }
        .risk-low { background: #e8f5e9; color: #388e3c; }
        .action-item {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
        }
        .action-item strong {
            color: #1976d2;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .intro-text, .outro-text {
            margin: 20px 0;
            padding: 15px;
            background: #fffde7;
            border-radius: 6px;
            border-left: 4px solid #fbc02d;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Your Pipeline Review is Ready</h1>
        <p>{{ review_name }} • {{ current_date }}</p>
    </div>

    {% if intro_text %}
    <div class="intro-text">
        {{ intro_text }}
    </div>
    {% endif %}

    <div class="summary-box">
        <h3>📊 Executive Summary</h3>
        <p>{{ pipeline_summary }}</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <div class="metric-value">{{ health_score }}</div>
            <div class="metric-label">Health Score</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ total_deals }}</div>
            <div class="metric-label">Total Deals</div>
        </div>
        <div class="metric">
            <div class="metric-value">{{ high_risk_count }}</div>
            <div class="metric-label">High Risk</div>
        </div>
        <div class="metric">
            <div class="metric-value">${{ total_value }}</div>
            <div class="metric-label">Pipeline Value</div>
        </div>
    </div>

    <h3>🚨 Top 3 At-Risk Deals</h3>
    {% for deal in top_3_risks %}
    <div class="risk-deal">
        <h4>
            {{ loop.index }}. {{ deal.deal_name }}
            <span class="risk-badge risk-high">{{ deal.risk_score }}/100</span>
        </h4>
        <p><strong>${{ deal.deal_value|int|format_number }}</strong></p>
        <p>{{ deal.why_at_risk }}</p>
        <p style="font-size: 12px; color: #666; font-style: italic;">
            💬 Defense: "{{ deal.defense_talking_point }}"
        </p>
    </div>
    {% endfor %}

    <h3>⚡ Critical Actions Needed Today</h3>
    {% for action in critical_actions[:5] %}
    <div class="action-item">
        <strong>{{ action.deal_name }}:</strong> {{ action.next_action }}
    </div>
    {% endfor %}

    {% if outro_text %}
    <div class="outro-text">
        {{ outro_text }}
    </div>
    {% endif %}

    <div style="text-align: center;">
        <a href="{{ view_url }}" class="btn">View Full Report →</a>
    </div>

    <div class="footer">
        <p>This is an automated review from RevTrust</p>
        <p>
            <a href="{{ frontend_url }}/scheduled-reviews">Manage Schedule</a> •
            <a href="{{ frontend_url }}/subscription">Subscription</a> •
            <a href="mailto:support@revtrust.com">Support</a>
        </p>
    </div>
</body>
</html>
        """


def get_email_delivery_service() -> EmailDeliveryService:
    """Get email delivery service instance"""
    return EmailDeliveryService()
