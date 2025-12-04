"""
Stripe webhook handler
"""

from fastapi import APIRouter, Request, HTTPException, Header
from prisma import Prisma
import stripe
import os

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None)
):
    """Handle Stripe webhook events"""

    if not STRIPE_WEBHOOK_SECRET:
        print("WARNING: STRIPE_WEBHOOK_SECRET not set")
        raise HTTPException(500, "Webhook secret not configured")

    # Get raw body
    payload = await request.body()

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        print(f"Invalid payload: {e}")
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        print(f"Invalid signature: {e}")
        raise HTTPException(400, "Invalid signature")

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    print(f"Received webhook: {event_type}")

    try:
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
            print(f"Unhandled event type: {event_type}")

    except Exception as e:
        print(f"Error handling webhook: {e}")
        raise HTTPException(500, str(e))

    return {"status": "success"}


async def handle_subscription_created(subscription):
    """Handle subscription.created event"""

    user_id = subscription["metadata"].get("user_id")
    if not user_id:
        print("No user_id in subscription metadata")
        return

    prisma = Prisma()
    await prisma.connect()

    try:
        await prisma.user.update(
            where={"clerkId": user_id},
            data={
                "subscriptionTier": "pro",
                "subscriptionStatus": "active",
                "stripeCustomerId": subscription["customer"],
                "stripeSubscriptionId": subscription["id"]
            }
        )
        print(f"✓ Updated user {user_id} to Pro")
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
        our_status = "active" if status == "active" else "cancelled"

        await prisma.user.update_many(
            where={"stripeSubscriptionId": subscription_id},
            data={
                "subscriptionStatus": our_status
            }
        )
        print(f"✓ Updated subscription {subscription_id} to {our_status}")
    finally:
        await prisma.disconnect()


async def handle_subscription_deleted(subscription):
    """Handle subscription.deleted event"""

    subscription_id = subscription["id"]

    prisma = Prisma()
    await prisma.connect()

    try:
        await prisma.user.update_many(
            where={"stripeSubscriptionId": subscription_id},
            data={
                "subscriptionTier": "free",
                "subscriptionStatus": "cancelled"
            }
        )
        print(f"✓ Downgraded subscription {subscription_id} to free")
    finally:
        await prisma.disconnect()


async def handle_payment_succeeded(invoice):
    """Handle invoice.payment_succeeded event"""

    print(f"✓ Payment succeeded for invoice {invoice['id']}")
    # Could send confirmation email here


async def handle_payment_failed(invoice):
    """Handle invoice.payment_failed event"""

    print(f"⚠ Payment failed for invoice {invoice['id']}")
    # Could send payment failure email here
