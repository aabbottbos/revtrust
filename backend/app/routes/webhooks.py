"""
Stripe webhook handler with error tracking and retry logic
"""

from fastapi import APIRouter, Request, HTTPException, Header
from prisma import Prisma
import stripe
import os
import logging
from datetime import datetime
from typing import Dict, Any
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

# Load Stripe configuration
STRIPE_API_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
MAX_RETRY_ATTEMPTS = 3

# Initialize Stripe API key
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY
    logger.info("Stripe API key configured for webhooks")
else:
    logger.warning("STRIPE_SECRET_KEY not found in environment")


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None)
):
    """Handle Stripe webhook events with error tracking and retry logic"""

    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(500, "Webhook secret not configured")

    # Get raw body
    payload = await request.body()

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(400, "Invalid signature")

    # Extract event details
    event_id = event.get("id")
    event_type = event["type"]
    data = event["data"]["object"]

    logger.info(f"📨 Received webhook: {event_type} (ID: {event_id})")

    # Track webhook processing
    webhook_result = await process_webhook_with_retry(event_id, event_type, data)

    if not webhook_result["success"]:
        # Log the failure but return 200 to Stripe to prevent retries
        # We've already retried internally
        logger.error(
            f"❌ Webhook {event_id} failed after {webhook_result['attempts']} attempts: "
            f"{webhook_result['error']}"
        )
        await log_webhook_failure(event_id, event_type, webhook_result)
    else:
        logger.info(f"✅ Webhook {event_id} processed successfully")

    # Always return 200 to Stripe to acknowledge receipt
    return {
        "status": "received",
        "event_id": event_id,
        "processed": webhook_result["success"]
    }


async def process_webhook_with_retry(
    event_id: str,
    event_type: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """Process webhook with automatic retry logic"""

    for attempt in range(1, MAX_RETRY_ATTEMPTS + 1):
        try:
            logger.info(f"🔄 Processing {event_type} (attempt {attempt}/{MAX_RETRY_ATTEMPTS})")

            if event_type == "customer.subscription.created":
                await handle_subscription_created(data)
            elif event_type == "customer.subscription.updated":
                await handle_subscription_updated(data)
            elif event_type == "customer.subscription.deleted":
                await handle_subscription_deleted(data)
            elif event_type == "invoice.payment_succeeded":
                await handle_payment_succeeded(data)
            elif event_type == "invoice.payment_failed":
                await handle_payment_failed(data)
            else:
                logger.info(f"ℹ️  Unhandled event type: {event_type}")

            return {
                "success": True,
                "attempts": attempt,
                "error": None
            }

        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()

            logger.error(
                f"⚠️  Attempt {attempt} failed for {event_type}: {error_msg}\n{error_trace}"
            )

            # If this was the last attempt, return failure
            if attempt == MAX_RETRY_ATTEMPTS:
                return {
                    "success": False,
                    "attempts": attempt,
                    "error": error_msg,
                    "traceback": error_trace
                }

            # Otherwise, continue to next attempt
            logger.info(f"🔁 Retrying... ({attempt + 1}/{MAX_RETRY_ATTEMPTS})")


async def log_webhook_failure(
    event_id: str,
    event_type: str,
    result: Dict[str, Any]
):
    """Log webhook failures for monitoring and debugging"""

    try:
        prisma = Prisma()
        await prisma.connect()

        # Log to admin audit log for visibility
        await prisma.adminauditlog.create(
            data={
                "performedBy": "system",
                "performedByEmail": "webhooks@revtrust.net",
                "action": "webhook_failed",
                "actionCategory": "SYSTEM_CONFIG",
                "resourceType": "StripeWebhook",
                "resourceId": event_id,
                "resourceName": event_type,
                "changeDetails": {
                    "event_id": event_id,
                    "event_type": event_type,
                    "attempts": result["attempts"],
                    "error": result["error"],
                    "timestamp": datetime.utcnow().isoformat()
                },
                "success": False,
                "errorMessage": result.get("error", "Unknown error")
            }
        )

        logger.info(f"📝 Logged webhook failure to audit log: {event_id}")

    except Exception as e:
        logger.error(f"Failed to log webhook failure: {e}")
    finally:
        try:
            await prisma.disconnect()
        except:
            pass


async def handle_subscription_created(subscription):
    """Handle subscription.created event"""

    user_id = subscription["metadata"].get("user_id")
    if not user_id:
        logger.warning(f"⚠️  No user_id in subscription metadata for {subscription['id']}")
        raise ValueError("Missing user_id in subscription metadata")

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await prisma.user.update(
            where={"clerkId": user_id},
            data={
                "subscriptionTier": "pro",
                "subscriptionStatus": "active",
                "stripeCustomerId": subscription["customer"],
                "stripeSubscriptionId": subscription["id"]
            }
        )
        logger.info(
            f"✅ Subscription created: User {user_id} upgraded to Pro "
            f"(Subscription: {subscription['id']})"
        )
    except Exception as e:
        logger.error(f"❌ Failed to update user {user_id}: {e}")
        raise
    finally:
        await prisma.disconnect()


async def handle_subscription_updated(subscription):
    """Handle subscription.updated event"""

    subscription_id = subscription["id"]
    status = subscription["status"]

    prisma = Prisma()
    await prisma.connect()

    try:
        # Map Stripe status to our status
        # active, trialing = user has access
        # past_due, unpaid, canceled, incomplete, incomplete_expired = no access
        if status in ["active", "trialing"]:
            our_status = "active"
        else:
            our_status = "cancelled"

        result = await prisma.user.update_many(
            where={"stripeSubscriptionId": subscription_id},
            data={
                "subscriptionStatus": our_status
            }
        )

        if result == 0:
            logger.warning(
                f"⚠️  No user found with subscription ID {subscription_id}"
            )
        else:
            logger.info(
                f"✅ Subscription updated: {subscription_id} → {our_status} "
                f"(Stripe status: {status})"
            )
    except Exception as e:
        logger.error(f"❌ Failed to update subscription {subscription_id}: {e}")
        raise
    finally:
        await prisma.disconnect()


async def handle_subscription_deleted(subscription):
    """Handle subscription.deleted event"""

    subscription_id = subscription["id"]

    prisma = Prisma()
    await prisma.connect()

    try:
        result = await prisma.user.update_many(
            where={"stripeSubscriptionId": subscription_id},
            data={
                "subscriptionTier": "free",
                "subscriptionStatus": "cancelled"
            }
        )

        if result == 0:
            logger.warning(
                f"⚠️  No user found with subscription ID {subscription_id}"
            )
        else:
            logger.info(
                f"✅ Subscription deleted: {subscription_id} → downgraded to free"
            )
    except Exception as e:
        logger.error(f"❌ Failed to delete subscription {subscription_id}: {e}")
        raise
    finally:
        await prisma.disconnect()


async def handle_payment_succeeded(invoice):
    """Handle invoice.payment_succeeded event"""

    invoice_id = invoice['id']
    customer_id = invoice.get('customer')
    amount_paid = invoice.get('amount_paid', 0) / 100  # Convert from cents

    logger.info(
        f"✅ Payment succeeded: Invoice {invoice_id} "
        f"(Customer: {customer_id}, Amount: ${amount_paid:.2f})"
    )

    # TODO: Send confirmation email here
    # from app.services.email_service import send_payment_confirmation
    # await send_payment_confirmation(customer_id, invoice_id, amount_paid)


async def handle_payment_failed(invoice):
    """Handle invoice.payment_failed event"""

    invoice_id = invoice['id']
    customer_id = invoice.get('customer')
    amount_due = invoice.get('amount_due', 0) / 100  # Convert from cents

    logger.warning(
        f"⚠️  Payment failed: Invoice {invoice_id} "
        f"(Customer: {customer_id}, Amount: ${amount_due:.2f})"
    )

    # TODO: Send payment failure email here
    # from app.services.email_service import send_payment_failed_notification
    # await send_payment_failed_notification(customer_id, invoice_id, amount_due)
