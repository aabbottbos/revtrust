"""Test enhanced AI service"""

import asyncio
from dotenv import load_dotenv
from app.services.ai_service import get_ai_service

# Load environment variables from .env file
load_dotenv()

async def test_enhanced_ai_analysis():
    """Test enhanced AI deal analysis"""

    # Sample deals with varying risk profiles
    deals = [
        {
            "id": "deal-1",
            "name": "Acme Corp - Enterprise Deal",
            "amount": 150000,
            "close_date": "2025-01-15",
            "stage": "Negotiation",
            "owner": "John Smith",
            "account": "Acme Corporation",
            "primary_contact": "Jane Doe",
            "last_activity_date": "2024-11-20",
            "created_date": "2024-09-01"
        },
        {
            "id": "deal-2",
            "name": "TechStart - Pro Plan",
            "amount": 25000,
            "close_date": "2025-02-28",
            "stage": "Proposal",
            "owner": "Sarah Johnson",
            "account": "TechStart Inc",
            "primary_contact": "Bob Wilson",
            "last_activity_date": "2024-12-01",
            "created_date": "2024-11-15"
        },
        {
            "id": "deal-3",
            "name": "GlobalCo - Integration",
            "amount": 200000,
            "close_date": "2024-11-15",  # Past due!
            "stage": "Discovery",
            "owner": "Mike Chen",
            "account": "Global Company",
            "primary_contact": None,  # Missing!
            "last_activity_date": "2024-10-20",
            "created_date": "2024-08-01"
        }
    ]

    # Sample violations per deal
    violations_by_deal = {
        "deal-1": [
            {
                "severity": "critical",
                "rule_name": "Stale Deal (30+ days)",
                "message": "No activity in 13 days for $150K deal"
            },
            {
                "severity": "warning",
                "rule_name": "Missing Next Step",
                "message": "Next step not defined"
            }
        ],
        "deal-2": [
            {
                "severity": "info",
                "rule_name": "Stage Check",
                "message": "Deal in early stage"
            }
        ],
        "deal-3": [
            {
                "severity": "critical",
                "rule_name": "Close Date Passed",
                "message": "Close date was 18 days ago"
            },
            {
                "severity": "critical",
                "rule_name": "Missing Primary Contact",
                "message": "No primary contact assigned"
            },
            {
                "severity": "critical",
                "rule_name": "Very Stale Deal",
                "message": "No activity in 43 days"
            }
        ]
    }

    # Run analysis
    ai_service = get_ai_service()

    print("=" * 80)
    print("RUNNING AI ANALYSIS ON 3 DEALS")
    print("=" * 80)

    results = await ai_service.analyze_pipeline(deals, violations_by_deal)

    print(f"\n✓ Analyzed {len(results)} deals\n")

    for i, result in enumerate(results, 1):
        deal = next(d for d in deals if d['id'] == result.deal_id)
        print(f"\n{'=' * 80}")
        print(f"DEAL #{i}: {result.deal_name}")
        print(f"{'=' * 80}")
        print(f"Value: ${deal['amount']:,.2f}")
        print(f"\nRISK ASSESSMENT:")
        print(f"  Score: {result.risk_score}/100 ({result.risk_level.upper()})")
        print(f"  Confidence: {result.confidence * 100:.0f}%")
        print(f"\nRISK FACTORS:")
        for factor in result.risk_factors:
            print(f"  • {factor}")
        print(f"\nNEXT BEST ACTION ({result.action_priority.upper()} priority):")
        print(f"  → {result.next_best_action}")
        print(f"\nRATIONALE:")
        print(f"  {result.action_rationale}")
        print(f"\nEXECUTIVE SUMMARY:")
        print(f"  {result.executive_summary}")

    # Test pipeline summary
    print(f"\n\n{'=' * 80}")
    print("PIPELINE SUMMARY")
    print(f"{'=' * 80}")

    summary = await ai_service.generate_pipeline_summary(deals, results)

    print(f"\nOverall Health: {summary.get('overall_health', 'unknown').upper()}")
    print(f"Health Score: {summary.get('health_score', 0)}/100")
    print(f"\nKey Insight:")
    print(f"  {summary.get('key_insight', 'N/A')}")
    print(f"\nTop 3 At-Risk Deals:")
    for i, risk in enumerate(summary.get('top_3_risks', []), 1):
        print(f"\n  {i}. {risk.get('deal_name', 'Unknown')} (${risk.get('deal_value', 0):,.0f})")
        print(f"     Risk Score: {risk.get('risk_score', 0)}/100")
        print(f"     Why: {risk.get('why_at_risk', 'Unknown')}")
        print(f"     Defense: {risk.get('defense_talking_point', 'N/A')}")

    print(f"\nRecommended Focus:")
    print(f"  {summary.get('recommended_focus', 'N/A')}")
    print(f"\nForecast Impact:")
    print(f"  {summary.get('forecast_impact', 'N/A')}")

    print(f"\n{'=' * 80}")
    print("✓ AI ANALYSIS COMPLETE")
    print(f"{'=' * 80}\n")

if __name__ == "__main__":
    asyncio.run(test_enhanced_ai_analysis())
