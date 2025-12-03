"""Test AI service"""

import asyncio
from dotenv import load_dotenv
from app.services.ai_service import get_ai_service

# Load environment variables from .env file
load_dotenv()

async def test_ai_analysis():
    """Test AI deal analysis"""

    # Sample deal data
    deal = {
        "id": "test-123",
        "name": "Acme Corp - Enterprise Deal",
        "amount": 75000,
        "close_date": "2025-01-15",
        "stage": "Negotiation",
        "owner": "John Smith",
        "account": "Acme Corporation",
        "primary_contact": "Jane Doe",
        "last_activity_date": "2024-11-20",
        "created_date": "2024-10-01"
    }

    # Sample violations
    violations = [
        {
            "severity": "critical",
            "rule_name": "Stale Deal (30+ days)",
            "message": "No activity in 13 days for deal worth $75,000"
        },
        {
            "severity": "warning",
            "rule_name": "Missing Next Step",
            "message": "Next step is not defined"
        }
    ]

    # Run analysis
    print("Testing AI Service...")
    print("=" * 60)

    try:
        ai_service = get_ai_service()
        result = await ai_service.analyze_deal(deal, violations)

        print("\n✅ AI Analysis Result:")
        print(f"Deal: {result.deal_name}")
        print(f"Risk Score: {result.risk_score}/100")
        print(f"Risk Level: {result.risk_level}")
        print(f"\nRisk Factors:")
        for factor in result.risk_factors:
            print(f"  - {factor}")
        print(f"\nNext Best Action: {result.next_best_action}")
        print(f"Priority: {result.action_priority}")
        print(f"Rationale: {result.action_rationale}")
        print(f"\nExecutive Summary: {result.executive_summary}")
        print(f"Confidence: {result.confidence}")
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")

    except ValueError as e:
        if "ANTHROPIC_API_KEY not set" in str(e):
            print("\n❌ ERROR: ANTHROPIC_API_KEY is not set in your .env file")
            print("\nTo fix this:")
            print("1. Get your API key from: https://console.anthropic.com/")
            print("2. Add it to backend/.env file:")
            print('   ANTHROPIC_API_KEY="sk-ant-..."')
            print("\nNote: You need a valid Anthropic API key to run AI analysis")
        else:
            print(f"\n❌ ERROR: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ai_analysis())
