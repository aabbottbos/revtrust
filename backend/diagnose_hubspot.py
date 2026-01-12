#!/usr/bin/env python3
"""
Diagnostic script to test HubSpot connection and deal fetching.
Usage: python diagnose_hubspot.py <user_email>
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from prisma import Prisma
from hubspot import HubSpot
from app.services.encryption_service import get_encryption_service


async def diagnose_hubspot(user_email: str):
    """Diagnose HubSpot connection for a user"""

    print(f"\n{'='*60}")
    print(f"🔍 HubSpot Connection Diagnostic")
    print(f"{'='*60}")
    print(f"User: {user_email}\n")

    prisma = Prisma()
    await prisma.connect()

    try:
        # Step 1: Find user
        print("1️⃣  Looking up user...")
        user = await prisma.user.find_unique(where={"email": user_email})

        if not user:
            print(f"   ❌ User not found with email: {user_email}")
            return

        print(f"   ✓ Found user: {user.id}")
        print(f"   ✓ Clerk ID: {user.clerkId}")

        # Step 2: Find HubSpot connection
        print("\n2️⃣  Looking up HubSpot connection...")
        connection = await prisma.crmconnection.find_first(
            where={
                "userId": user.id,
                "provider": "hubspot"
            }
        )

        if not connection:
            print(f"   ❌ No HubSpot connection found for this user")
            return

        print(f"   ✓ Connection ID: {connection.id}")
        print(f"   ✓ Account Name: {connection.accountName}")
        print(f"   ✓ Is Active: {connection.isActive}")
        print(f"   ✓ Last Sync: {connection.lastSyncAt}")
        print(f"   ✓ Token length (encrypted): {len(connection.accessToken) if connection.accessToken else 0}")

        # Step 3: Decrypt token
        print("\n3️⃣  Decrypting access token...")
        encryption = get_encryption_service()

        try:
            access_token = encryption.decrypt(connection.accessToken)
            print(f"   ✓ Token decrypted successfully")
            print(f"   ✓ Token length: {len(access_token)}")
            print(f"   ✓ Token prefix: {access_token[:20]}...")
        except Exception as e:
            print(f"   ❌ Failed to decrypt token: {e}")
            return

        # Step 4: Test token with HubSpot API
        print("\n4️⃣  Testing HubSpot API connection...")

        try:
            client = HubSpot(access_token=access_token)

            # Get token info
            import requests
            token_info_response = requests.get(
                f"https://api.hubapi.com/oauth/v1/access-tokens/{access_token}"
            )

            if token_info_response.status_code == 200:
                token_info = token_info_response.json()
                print(f"   ✓ Token is valid!")
                print(f"   ✓ Hub ID: {token_info.get('hub_id')}")
                print(f"   ✓ Hub Domain: {token_info.get('hub_domain')}")
                print(f"   ✓ User ID: {token_info.get('user_id')}")
                print(f"   ✓ Scopes: {token_info.get('scopes', [])}")

                # Check for deals scope
                scopes = token_info.get('scopes', [])
                if 'crm.objects.deals.read' in scopes:
                    print(f"   ✓ Has deals read permission")
                else:
                    print(f"   ⚠️  Missing 'crm.objects.deals.read' scope!")
                    print(f"      Available scopes: {scopes}")
            else:
                print(f"   ⚠️  Could not verify token info: {token_info_response.status_code}")
                print(f"      Response: {token_info_response.text[:200]}")

        except Exception as e:
            print(f"   ❌ API connection failed: {e}")
            return

        # Step 5: Fetch deals
        print("\n5️⃣  Fetching deals from HubSpot...")

        try:
            properties = [
                "dealname",
                "amount",
                "closedate",
                "dealstage",
                "pipeline",
                "hs_object_id",
                "createdate"
            ]

            deals_response = client.crm.deals.basic_api.get_page(
                limit=100,
                properties=properties,
                archived=False
            )

            deals_count = len(deals_response.results)
            print(f"   ✓ API call successful!")
            print(f"   ✓ Deals returned: {deals_count}")

            if deals_count == 0:
                print("\n   ⚠️  No deals found. Possible reasons:")
                print("      - The HubSpot account has no deals")
                print("      - All deals are archived")
                print("      - Token permissions issue")

                # Try to check if there are archived deals
                print("\n   🔍 Checking for archived deals...")
                archived_response = client.crm.deals.basic_api.get_page(
                    limit=10,
                    archived=True
                )
                archived_count = len(archived_response.results)
                print(f"      Archived deals found: {archived_count}")

            else:
                print(f"\n   📋 First {min(5, deals_count)} deals:")
                for i, deal in enumerate(deals_response.results[:5]):
                    props = deal.properties
                    print(f"      {i+1}. {props.get('dealname', 'Untitled')} - Stage: {props.get('dealstage')} - Amount: {props.get('amount', 'N/A')}")

                # Check paging
                if hasattr(deals_response, 'paging') and deals_response.paging:
                    print(f"\n   📄 More deals available (paginated)")

        except Exception as e:
            print(f"   ❌ Failed to fetch deals: {e}")
            import traceback
            traceback.print_exc()

        # Step 6: Check pipelines
        print("\n6️⃣  Checking deal pipelines...")
        try:
            pipelines = client.crm.pipelines.pipelines_api.get_all(object_type="deals")
            print(f"   ✓ Found {len(pipelines.results)} pipeline(s):")
            for pipeline in pipelines.results:
                print(f"      - {pipeline.label} (ID: {pipeline.id})")
                print(f"        Stages: {[s.label for s in pipeline.stages]}")
        except Exception as e:
            print(f"   ⚠️  Could not fetch pipelines: {e}")

        print(f"\n{'='*60}")
        print("✅ Diagnostic complete!")
        print(f"{'='*60}\n")

    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python diagnose_hubspot.py <user_email>")
        print("Example: python diagnose_hubspot.py aabbott@gmail.com")
        sys.exit(1)

    user_email = sys.argv[1]
    asyncio.run(diagnose_hubspot(user_email))
