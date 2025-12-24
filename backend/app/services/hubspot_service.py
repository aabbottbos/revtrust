"""
HubSpot integration service with OAuth support
"""

from hubspot import HubSpot
from hubspot.crm.deals import ApiException
from typing import List, Dict, Optional
import os
import requests
import hashlib
import base64
import secrets
from urllib.parse import urlencode
from datetime import datetime, timedelta, timezone
from app.services.encryption_service import get_encryption_service
from prisma import Prisma


class HubSpotService:
    """Handle HubSpot OAuth integration"""

    def __init__(self):
        self.encryption = get_encryption_service()
        self.client_id = os.getenv("HUBSPOT_CLIENT_ID")
        self.client_secret = os.getenv("HUBSPOT_CLIENT_SECRET")
        self.redirect_uri = os.getenv("HUBSPOT_REDIRECT_URI", "http://localhost:3000/api/oauth/hubspot/callback")

    def get_authorize_url(self, state: str) -> str:
        """Generate HubSpot OAuth authorization URL"""
        base_url = "https://app.hubspot.com/oauth/authorize"
        # Scopes must match what's registered in HubSpot app (app-hsmeta.json)
        scopes = "oauth crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.companies.read crm.schemas.custom.read"

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scopes,
            "state": state
        }

        # Use urlencode to properly encode spaces and special characters
        query_string = urlencode(params)
        return f"{base_url}?{query_string}"

    async def exchange_code_for_tokens(self, code: str) -> Dict:
        """Exchange authorization code for access/refresh tokens"""
        token_url = "https://api.hubapi.com/oauth/v1/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")

        data = response.json()

        # HubSpot tokens expire in the time specified by expires_in (seconds)
        expires_in = data.get("expires_in", 21600)  # Default 6 hours

        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict:
        """Refresh an expired access token"""
        token_url = "https://api.hubapi.com/oauth/v1/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.text}")

        data = response.json()
        expires_in = data.get("expires_in", 21600)

        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        }

    async def get_account_info(self, access_token: str) -> Dict:
        """Get HubSpot account info using access token"""
        try:
            # Get access token info which includes hub_id
            response = requests.get(
                f"https://api.hubapi.com/oauth/v1/access-tokens/{access_token}"
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "hub_id": data.get("hub_id"),
                    "hub_domain": data.get("hub_domain", "HubSpot"),
                    "user_id": data.get("user_id"),
                    "user": data.get("user")
                }
        except Exception as e:
            print(f"Error getting account info: {e}")

        return {"hub_domain": "HubSpot"}

    async def create_connection(
        self,
        user_id: str,
        access_token: str,
        account_name: Optional[str] = None
    ) -> str:
        """Create a new HubSpot connection with Private App access token"""

        # Test the token first
        if not await self._test_token(access_token):
            raise Exception("Invalid HubSpot access token")

        # Get account info if not provided
        if not account_name:
            account_name = await self._get_account_name(access_token)

        # Encrypt token
        encrypted_token = self.encryption.encrypt(access_token)

        # Store in database
        prisma = Prisma()
        await prisma.connect()

        try:
            # Check if connection already exists for this user
            existing = await prisma.crmconnection.find_first(
                where={
                    "userId": user_id,
                    "provider": "hubspot"
                }
            )

            if existing:
                # Update existing
                await prisma.crmconnection.update(
                    where={"id": existing.id},
                    data={
                        "accessToken": encrypted_token,
                        "accountName": account_name,
                        "isActive": True
                    }
                )
                return existing.id
            else:
                # Create new
                connection = await prisma.crmconnection.create(
                    data={
                        "userId": user_id,
                        "provider": "hubspot",
                        "accessToken": encrypted_token,
                        "accountName": account_name
                    }
                )
                return connection.id

        finally:
            await prisma.disconnect()

    async def _test_token(self, access_token: str) -> bool:
        """Test if access token is valid"""
        try:
            client = HubSpot(access_token=access_token)
            # Try to fetch one deal to verify token
            client.crm.deals.basic_api.get_page(limit=1)
            return True
        except Exception as e:
            print(f"Token test failed: {e}")
            return False

    async def _get_account_name(self, access_token: str) -> str:
        """Get HubSpot account name"""
        try:
            client = HubSpot(access_token=access_token)
            # Get account info
            account_info = client.auth.oauth.access_tokens_api.get_access_token(access_token)
            return account_info.hub_domain or "HubSpot"
        except Exception:
            return "HubSpot"

    async def get_valid_token(
        self,
        connection_id: str
    ) -> str:
        """Get access token for a connection, refreshing if necessary"""

        prisma = Prisma()
        await prisma.connect()

        try:
            connection = await prisma.crmconnection.find_unique(
                where={"id": connection_id}
            )

            if not connection:
                raise Exception("Connection not found")

            # Check if token is expired or expiring soon (for OAuth connections)
            if connection.expiresAt and connection.refreshToken:
                # This is an OAuth connection - check expiry
                if connection.expiresAt < datetime.now(timezone.utc) + timedelta(minutes=5):
                    # Token is expired or expiring soon - refresh it
                    refresh_token = self.encryption.decrypt(connection.refreshToken)
                    token_data = await self.refresh_access_token(refresh_token)

                    # Encrypt new tokens
                    encrypted_access = self.encryption.encrypt(token_data["access_token"])
                    encrypted_refresh = self.encryption.encrypt(token_data["refresh_token"])

                    # Update in database
                    await prisma.crmconnection.update(
                        where={"id": connection_id},
                        data={
                            "accessToken": encrypted_access,
                            "refreshToken": encrypted_refresh,
                            "expiresAt": token_data["expires_at"]
                        }
                    )

                    return token_data["access_token"]

            # Return the current token (either valid OAuth or Private App token)
            return self.encryption.decrypt(connection.accessToken)

        finally:
            await prisma.disconnect()

    async def fetch_deals(
        self,
        connection_id: str,
        limit: int = 1000
    ) -> List[Dict]:
        """Fetch deals from HubSpot with pagination"""

        access_token = await self.get_valid_token(connection_id)

        # Initialize HubSpot client
        client = HubSpot(access_token=access_token)

        try:
            # HubSpot API has a max limit of 100 per request, so we need to paginate
            page_size = 100
            deals = []
            after = None
            total_fetched = 0

            properties = [
                "dealname",
                "amount",
                "closedate",
                "dealstage",
                "pipeline",
                "hs_object_id",
                "createdate",
                "hs_lastmodifieddate",
                "notes_last_updated",
                "hubspot_owner_id"
            ]

            while total_fetched < limit:
                # Calculate how many to fetch in this request
                current_limit = min(page_size, limit - total_fetched)

                # Fetch deals with properties
                deals_response = client.crm.deals.basic_api.get_page(
                    limit=current_limit,
                    properties=properties,
                    archived=False,
                    after=after
                )

                # Normalize to RevTrust format
                for deal in deals_response.results:
                    props = deal.properties

                    deals.append({
                        "id": deal.id,
                        "name": props.get("dealname", "Untitled Deal"),
                        "amount": float(props.get("amount", 0)) if props.get("amount") else 0,
                        "close_date": props.get("closedate"),
                        "stage": props.get("dealstage"),
                        "pipeline": props.get("pipeline"),
                        "created_date": props.get("createdate"),
                        "last_modified_date": props.get("hs_lastmodifieddate"),
                        "last_activity_date": props.get("notes_last_updated"),
                        "owner_id": props.get("hubspot_owner_id")
                    })

                total_fetched += len(deals_response.results)

                # Check if there are more pages
                if hasattr(deals_response, 'paging') and deals_response.paging and hasattr(deals_response.paging, 'next'):
                    after = deals_response.paging.next.after
                else:
                    # No more pages
                    break

            return deals

        except ApiException as e:
            print(f"HubSpot API error: {e}")
            raise

    async def test_connection(self, connection_id: str) -> bool:
        """Test if connection is working"""

        try:
            deals = await self.fetch_deals(connection_id, limit=1)
            return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False


def get_hubspot_service() -> HubSpotService:
    """Get HubSpot service instance"""
    return HubSpotService()
