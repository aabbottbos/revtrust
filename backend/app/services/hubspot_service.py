"""
HubSpot integration service
"""

from hubspot import HubSpot
from hubspot.crm.deals import ApiException
from typing import List, Dict
import requests
import os
from datetime import datetime, timedelta
from app.services.encryption_service import get_encryption_service
from prisma import Prisma


class HubSpotService:
    """Handle HubSpot OAuth and data fetching"""

    def __init__(self):
        self.encryption = get_encryption_service()

    def get_authorize_url(self, state: str) -> str:
        """Generate HubSpot OAuth authorization URL"""

        base_url = "https://app.hubspot.com/oauth/authorize"
        params = {
            "client_id": os.getenv("HUBSPOT_CLIENT_ID"),
            "redirect_uri": os.getenv("HUBSPOT_REDIRECT_URI"),
            "scope": "crm.objects.deals.read crm.schemas.deals.read",
            "state": state
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"

    async def exchange_code_for_tokens(
        self,
        code: str
    ) -> Dict:
        """Exchange authorization code for access/refresh tokens"""

        token_url = "https://api.hubapi.com/oauth/v1/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": os.getenv("HUBSPOT_CLIENT_ID"),
                "client_secret": os.getenv("HUBSPOT_CLIENT_SECRET"),
                "redirect_uri": os.getenv("HUBSPOT_REDIRECT_URI")
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")

        data = response.json()

        # HubSpot tokens expire in 6 hours
        expires_in = data.get("expires_in", 21600)

        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_at": datetime.now() + timedelta(seconds=expires_in)
        }

    async def refresh_access_token(
        self,
        refresh_token: str
    ) -> Dict:
        """Refresh an expired access token"""

        token_url = "https://api.hubapi.com/oauth/v1/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": os.getenv("HUBSPOT_CLIENT_ID"),
                "client_secret": os.getenv("HUBSPOT_CLIENT_SECRET")
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.text}")

        data = response.json()

        expires_in = data.get("expires_in", 21600)

        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_at": datetime.now() + timedelta(seconds=expires_in)
        }

    async def get_valid_token(
        self,
        connection_id: str
    ) -> str:
        """Get a valid access token, refreshing if necessary"""

        prisma = Prisma()
        await prisma.connect()

        try:
            connection = await prisma.crmconnection.find_unique(
                where={"id": connection_id}
            )

            if not connection:
                raise Exception("Connection not found")

            # Check if token is expired or expiring soon
            if connection.expiresAt < datetime.now() + timedelta(minutes=5):
                # Refresh token
                refresh_token = self.encryption.decrypt(connection.refreshToken)
                token_data = await self.refresh_access_token(refresh_token)

                # Update in database
                await prisma.crmconnection.update(
                    where={"id": connection_id},
                    data={
                        "accessToken": self.encryption.encrypt(token_data["access_token"]),
                        "refreshToken": self.encryption.encrypt(token_data["refresh_token"]),
                        "expiresAt": token_data["expires_at"]
                    }
                )

                return token_data["access_token"]

            # Token still valid
            return self.encryption.decrypt(connection.accessToken)

        finally:
            await prisma.disconnect()

    async def fetch_deals(
        self,
        connection_id: str,
        limit: int = 1000
    ) -> List[Dict]:
        """Fetch deals from HubSpot"""

        access_token = await self.get_valid_token(connection_id)

        # Initialize HubSpot client
        client = HubSpot(access_token=access_token)

        try:
            # Fetch deals with properties
            deals_response = client.crm.deals.basic_api.get_page(
                limit=limit,
                properties=[
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
                ],
                archived=False
            )

            # Normalize to RevTrust format
            deals = []
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
