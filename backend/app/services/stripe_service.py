"""
Stripe service for handling subscriptions
"""

import stripe
import os
from typing import Dict, Optional

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    """Handle all Stripe operations"""

    def __init__(self):
        self.pro_price_id = os.getenv("STRIPE_PRO_PRICE_ID")
        if not self.pro_price_id:
            print("WARNING: STRIPE_PRO_PRICE_ID not set")

    def create_checkout_session(
        self,
        user_id: str,
        user_email: str,
        success_url: str,
        cancel_url: str
    ) -> Dict:
        """Create Stripe checkout session for Pro subscription"""

        try:
            session = stripe.checkout.Session.create(
                customer_email=user_email,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": self.pro_price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user_id
                },
                subscription_data={
                    "metadata": {
                        "user_id": user_id
                    }
                }
            )

            return {
                "session_id": session.id,
                "url": session.url
            }

        except Exception as e:
            print(f"Error creating checkout session: {e}")
            raise

    def create_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> Dict:
        """Create customer portal session for subscription management"""

        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )

            return {
                "url": session.url
            }

        except Exception as e:
            print(f"Error creating portal session: {e}")
            raise

    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details"""

        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        except Exception as e:
            print(f"Error retrieving subscription: {e}")
            return None

    def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel subscription at period end"""

        try:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return True
        except Exception as e:
            print(f"Error canceling subscription: {e}")
            return False


def get_stripe_service() -> StripeService:
    """Get Stripe service instance"""
    return StripeService()
