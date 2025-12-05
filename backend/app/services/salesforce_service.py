"""
Salesforce integration service
"""

from simple_salesforce import Salesforce
from typing import List, Dict, Optional
import requests
import os
import hashlib
import base64
import secrets
from datetime import datetime, timedelta
from app.services.encryption_service import get_encryption_service
from prisma import Prisma


class SalesforceService:
    """Handle Salesforce OAuth and data fetching"""

    def __init__(self):
        self.encryption = get_encryption_service()

    def _generate_pkce_pair(self) -> tuple[str, str]:
        """Generate PKCE code verifier and challenge"""
        # Generate code verifier (43-128 characters)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

        # Generate code challenge (SHA256 hash of verifier)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')

        return code_verifier, code_challenge

    def get_authorize_url(self, state: str) -> Dict:
        """Generate Salesforce OAuth authorization URL with PKCE"""

        # Generate PKCE pair
        code_verifier, code_challenge = self._generate_pkce_pair()

        base_url = "https://login.salesforce.com/services/oauth2/authorize"
        params = {
            "response_type": "code",
            "client_id": os.getenv("SALESFORCE_CLIENT_ID"),
            "redirect_uri": os.getenv("SALESFORCE_REDIRECT_URI"),
            "state": state,
            "scope": "api refresh_token offline_access",
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{base_url}?{query_string}"

        return {
            "url": auth_url,
            "code_verifier": code_verifier
        }

    async def exchange_code_for_tokens(
        self,
        code: str,
        code_verifier: str
    ) -> Dict:
        """Exchange authorization code for access/refresh tokens"""

        token_url = "https://login.salesforce.com/services/oauth2/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": os.getenv("SALESFORCE_CLIENT_ID"),
                "client_secret": os.getenv("SALESFORCE_CLIENT_SECRET"),
                "redirect_uri": os.getenv("SALESFORCE_REDIRECT_URI"),
                "code_verifier": code_verifier
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")

        data = response.json()

        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "instance_url": data["instance_url"],
            "expires_at": datetime.now() + timedelta(hours=2)  # SF tokens expire in 2 hours
        }

    async def refresh_access_token(
        self,
        refresh_token: str
    ) -> Dict:
        """Refresh an expired access token"""

        token_url = "https://login.salesforce.com/services/oauth2/token"

        response = requests.post(
            token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": os.getenv("SALESFORCE_CLIENT_ID"),
                "client_secret": os.getenv("SALESFORCE_CLIENT_SECRET")
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.text}")

        data = response.json()

        return {
            "access_token": data["access_token"],
            "instance_url": data["instance_url"],
            "expires_at": datetime.now() + timedelta(hours=2)
        }

    async def get_valid_token(
        self,
        connection_id: str
    ) -> tuple[str, str]:
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
                        "expiresAt": token_data["expires_at"],
                        "instanceUrl": token_data["instance_url"]
                    }
                )

                return token_data["access_token"], token_data["instance_url"]

            # Token still valid
            access_token = self.encryption.decrypt(connection.accessToken)
            return access_token, connection.instanceUrl

        finally:
            await prisma.disconnect()

    async def fetch_opportunities(
        self,
        connection_id: str,
        limit: int = 1000
    ) -> List[Dict]:
        """Fetch opportunities (deals) from Salesforce"""

        access_token, instance_url = await self.get_valid_token(connection_id)

        # Initialize Salesforce client
        sf = Salesforce(
            instance_url=instance_url,
            session_id=access_token
        )

        # Query opportunities
        query = """
        SELECT
            Id,
            Name,
            Amount,
            CloseDate,
            StageName,
            Probability,
            Owner.Name,
            Account.Name,
            CreatedDate,
            LastActivityDate,
            LastModifiedDate,
            NextStep,
            Description,
            IsClosed,
            IsWon
        FROM Opportunity
        WHERE IsClosed = false
        ORDER BY CloseDate ASC
        LIMIT {}
        """.format(limit)

        result = sf.query(query)

        # Normalize to RevTrust format
        deals = []
        for opp in result['records']:
            deals.append({
                "id": opp["Id"],
                "name": opp["Name"],
                "amount": opp["Amount"] or 0,
                "close_date": opp["CloseDate"],
                "stage": opp["StageName"],
                "probability": opp.get("Probability"),
                "owner": opp["Owner"]["Name"] if opp.get("Owner") else None,
                "account": opp["Account"]["Name"] if opp.get("Account") else None,
                "created_date": opp["CreatedDate"],
                "last_activity_date": opp.get("LastActivityDate"),
                "last_modified_date": opp["LastModifiedDate"],
                "next_step": opp.get("NextStep"),
                "description": opp.get("Description"),
                "is_closed": opp["IsClosed"],
                "is_won": opp["IsWon"]
            })

        return deals

    async def test_connection(self, connection_id: str) -> bool:
        """Test if connection is working"""

        try:
            deals = await self.fetch_opportunities(connection_id, limit=1)
            return True
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False


def get_salesforce_service() -> SalesforceService:
    """Get Salesforce service instance"""
    return SalesforceService()
