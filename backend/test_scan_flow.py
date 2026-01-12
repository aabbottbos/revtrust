#!/usr/bin/env python3
"""
Test the complete scan flow for HubSpot
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from prisma import Prisma
from app.routes.scan import fetch_deals_from_crm
from app.utils.business_rules_engine import ContextualBusinessRulesEngine


async def test_scan_flow(user_email: str):
    """Test the complete scan flow"""

    print(f"\n{'='*60}")
    print(f"🧪 Testing Scan Flow")
    print(f"{'='*60}")
    print(f"User: {user_email}\n")

    prisma = Prisma()
    await prisma.connect()

    try:
        # Step 1: Find user
        print("1️⃣  Looking up user...")
        user = await prisma.user.find_unique(where={"email": user_email})
        if not user:
            print(f"   ❌ User not found")
            return
        print(f"   ✓ Found user: {user.id}")

        # Step 2: Find HubSpot connection
        print("\n2️⃣  Looking up HubSpot connection...")
        connection = await prisma.crmconnection.find_unique(
            where={"id": "34b38f1f-04d8-4de7-8bef-713b96cfa5d9"}
        )
        if not connection:
            print(f"   ❌ Connection not found")
            return
        print(f"   ✓ Connection: {connection.id}")
        print(f"   ✓ Provider: {connection.provider}")

        # Step 3: Fetch deals using the SAME function as scan route
        print("\n3️⃣  Fetching deals via fetch_deals_from_crm()...")
        try:
            deals = await fetch_deals_from_crm(connection)
            print(f"   ✓ Deals returned: {len(deals)}")

            if deals:
                for i, deal in enumerate(deals[:5]):
                    print(f"      {i+1}. {deal.get('name')} - Stage: {deal.get('stage')} - Amount: {deal.get('amount')}")
            else:
                print("   ⚠️  No deals returned!")

        except Exception as e:
            print(f"   ❌ Error fetching deals: {e}")
            import traceback
            traceback.print_exc()
            return

        # Step 4: Run business rules
        print("\n4️⃣  Running business rules analysis...")
        try:
            rules_engine = ContextualBusinessRulesEngine()
            await rules_engine.load_context(prisma, user_id=user.id, org_id=None)

            analysis_result = rules_engine.analyze_deals(deals)

            health_score = analysis_result["health_score"]
            violations = analysis_result["violations"]

            print(f"   ✓ Health Score: {health_score}")
            print(f"   ✓ Total Violations: {len(violations)}")

            if violations:
                print(f"\n   📋 Violations found:")
                for v in violations[:10]:
                    print(f"      - [{v.get('severity')}] {v.get('rule_id')}: {v.get('message')}")
            else:
                print("   ⚠️  No violations found")

        except Exception as e:
            print(f"   ❌ Error in analysis: {e}")
            import traceback
            traceback.print_exc()

        print(f"\n{'='*60}")
        print("✅ Test complete!")
        print(f"{'='*60}\n")

    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(test_scan_flow("aabbott@gmail.com"))
