"""
CRM OAuth routes for Salesforce and HubSpot
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from prisma import Prisma
import secrets
from datetime import datetime
from app.auth import get_current_user_id
from app.services.salesforce_service import get_salesforce_service
from app.services.hubspot_service import get_hubspot_service
from app.services.encryption_service import get_encryption_service

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])

# In-memory state storage (upgrade to Redis for production)
oauth_state_store = {}


# ============= SALESFORCE =============

@router.get("/salesforce/authorize")
async def salesforce_authorize(
    user_id: str = Depends(get_current_user_id)
):
    """Initiate Salesforce OAuth flow"""

    # Generate and store state
    state = secrets.token_urlsafe(32)

    # Get authorization URL with PKCE
    sf_service = get_salesforce_service()
    auth_data = sf_service.get_authorize_url(state)

    # Store state and code_verifier
    oauth_state_store[state] = {
        "user_id": user_id,
        "provider": "salesforce",
        "code_verifier": auth_data["code_verifier"],
        "created_at": datetime.now()
    }

    return {"authorization_url": auth_data["url"]}


@router.get("/salesforce/callback")
async def salesforce_callback(
    code: str = Query(...),
    state: str = Query(...)
):
    """Handle Salesforce OAuth callback"""

    # Verify state
    if state not in oauth_state_store:
        raise HTTPException(400, "Invalid state parameter")

    state_data = oauth_state_store.pop(state)
    user_id = state_data["user_id"]
    code_verifier = state_data["code_verifier"]

    try:
        # Exchange code for tokens
        sf_service = get_salesforce_service()
        token_data = await sf_service.exchange_code_for_tokens(code, code_verifier)

        # Encrypt tokens
        encryption = get_encryption_service()
        encrypted_access = encryption.encrypt(token_data["access_token"])
        encrypted_refresh = encryption.encrypt(token_data["refresh_token"])

        # Store in database
        prisma = Prisma()
        await prisma.connect()

        try:
            # Get or create user and get database ID
            # user_id at this point is the Clerk ID, we need the database ID
            clerk_id = user_id

            user = await prisma.user.find_unique(where={"clerkId": clerk_id})

            if not user:
                # User doesn't exist yet - create them
                # For anonymous user, use a placeholder email
                email = "anonymous@revtrust.dev" if clerk_id == "anonymous_user" else f"{clerk_id}@clerk.user"
                user = await prisma.user.create(
                    data={
                        "clerkId": clerk_id,
                        "email": email
                    }
                )

            # Now use the database ID
            user_id = user.id

            # Check if connection already exists
            existing = await prisma.crmconnection.find_first(
                where={
                    "userId": user_id,
                    "provider": "salesforce"
                }
            )

            if existing:
                # Update existing
                await prisma.crmconnection.update(
                    where={"id": existing.id},
                    data={
                        "accessToken": encrypted_access,
                        "refreshToken": encrypted_refresh,
                        "instanceUrl": token_data["instance_url"],
                        "expiresAt": token_data["expires_at"],
                        "isActive": True
                    }
                )
                connection_id = existing.id
            else:
                # Create new
                connection = await prisma.crmconnection.create(
                    data={
                        "userId": user_id,
                        "provider": "salesforce",
                        "accessToken": encrypted_access,
                        "refreshToken": encrypted_refresh,
                        "instanceUrl": token_data["instance_url"],
                        "expiresAt": token_data["expires_at"],
                        "accountName": "Salesforce"
                    }
                )
                connection_id = connection.id

        finally:
            await prisma.disconnect()

        # Redirect to frontend success page
        return RedirectResponse(
            url=f"http://localhost:3000/crm/connected?provider=salesforce&connection_id={connection_id}"
        )

    except Exception as e:
        print(f"OAuth error: {e}")
        return RedirectResponse(
            url=f"http://localhost:3000/crm/error?message={str(e)}"
        )


# ============= HUBSPOT (Private App) =============

@router.post("/hubspot/connect")
async def hubspot_connect(
    request: dict,
    user_id: str = Depends(get_current_user_id)
):
    """Connect HubSpot using Private App access token"""

    access_token = request.get("access_token")
    if not access_token:
        raise HTTPException(400, "access_token is required")

    try:
        # Get database user
        prisma = Prisma()
        await prisma.connect()

        try:
            clerk_id = user_id
            user = await prisma.user.find_unique(where={"clerkId": clerk_id})

            if not user:
                # Create user if doesn't exist
                email = "anonymous@revtrust.dev" if clerk_id == "anonymous_user" else f"{clerk_id}@clerk.user"
                user = await prisma.user.create(
                    data={
                        "clerkId": clerk_id,
                        "email": email
                    }
                )

            # Create connection
            hs_service = get_hubspot_service()
            connection_id = await hs_service.create_connection(
                user_id=user.id,
                access_token=access_token
            )

            return {
                "status": "success",
                "connection_id": connection_id,
                "provider": "hubspot"
            }

        finally:
            await prisma.disconnect()

    except Exception as e:
        print(f"HubSpot connection error: {e}")
        raise HTTPException(400, str(e))


# ============= MANAGEMENT =============

@router.get("/connections")
async def list_connections(
    user_id: str = Depends(get_current_user_id)
):
    """List user's CRM connections"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Look up user by clerkId to get database ID
        user = await prisma.user.find_unique(where={"clerkId": user_id})
        if not user:
            return {"connections": []}

        # Query connections using database userId
        connections = await prisma.crmconnection.find_many(
            where={"userId": user.id}
        )

        return {
            "connections": [
                {
                    "id": conn.id,
                    "provider": conn.provider,
                    "account_name": conn.accountName,
                    "is_active": conn.isActive,
                    "last_sync_at": conn.lastSyncAt.isoformat() if conn.lastSyncAt else None,
                    "created_at": conn.createdAt.isoformat()
                }
                for conn in connections
            ]
        }
    finally:
        await prisma.disconnect()


@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a CRM connection"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Look up user by clerkId to get database ID
        user = await prisma.user.find_unique(where={"clerkId": user_id})
        if not user:
            raise HTTPException(404, "User not found")

        # Verify ownership
        connection = await prisma.crmconnection.find_unique(
            where={"id": connection_id}
        )

        if not connection or connection.userId != user.id:
            raise HTTPException(404, "Connection not found")

        # Delete
        await prisma.crmconnection.delete(
            where={"id": connection_id}
        )

        return {"status": "deleted"}
    finally:
        await prisma.disconnect()


@router.post("/connections/{connection_id}/test")
async def test_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Test a CRM connection"""

    prisma = Prisma()
    await prisma.connect()

    try:
        connection = await prisma.crmconnection.find_unique(
            where={"id": connection_id}
        )

        if not connection or connection.userId != user_id:
            raise HTTPException(404, "Connection not found")

        # Test based on provider
        if connection.provider == "salesforce":
            sf_service = get_salesforce_service()
            success = await sf_service.test_connection(connection_id)
        elif connection.provider == "hubspot":
            hs_service = get_hubspot_service()
            success = await hs_service.test_connection(connection_id)
        else:
            raise HTTPException(400, "Unknown provider")

        if success:
            # Update last sync time
            await prisma.crmconnection.update(
                where={"id": connection_id},
                data={"lastSyncAt": datetime.now()}
            )

        return {
            "status": "success" if success else "failed",
            "connection_id": connection_id
        }
    finally:
        await prisma.disconnect()
