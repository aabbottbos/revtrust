"""
Test script for business rules engine
"""
from datetime import datetime, timedelta
from app.utils.business_rules_engine import BusinessRulesEngine
import json


def test_rules_engine():
    """Test the business rules engine with sample deals"""

    print("=" * 80)
    print("Testing RevTrust Business Rules Engine")
    print("=" * 80)
    print()

    # Initialize the engine
    engine = BusinessRulesEngine()

    # Print rules summary
    print("📋 Rules Summary:")
    summary = engine.get_rules_summary()
    print(f"  Total rules loaded: {summary['total_rules']}")
    print(f"  By category:")
    for category, count in summary['by_category'].items():
        print(f"    - {category}: {count}")
    print(f"  By severity:")
    for severity, count in summary['by_severity'].items():
        print(f"    - {severity}: {count}")
    print()

    # Create sample deals with various issues
    sample_deals = [
        {
            'id': '1',
            'name': 'Acme Corp Deal',
            'account_name': 'Acme Corporation',
            'amount': 50000,
            'stage': 'Proposal',
            'close_date': (datetime.now() + timedelta(days=15)).isoformat(),
            'created_date': (datetime.now() - timedelta(days=10)).isoformat(),
            'last_activity_date': (datetime.now() - timedelta(days=2)).isoformat(),
            'probability': 60,
            'owner_name': 'John Smith',
            'contact_name': 'Jane Doe',
            'contact_email': 'jane@acme.com',
        },
        {
            'id': '2',
            'name': '',  # Missing name - critical
            'account_name': 'Widget Inc',
            'amount': 0,  # Zero amount - critical
            'stage': 'Discovery',
            'close_date': (datetime.now() - timedelta(days=30)).isoformat(),  # Past close date - critical
            'created_date': (datetime.now() - timedelta(days=200)).isoformat(),  # Old deal - warning
            'last_activity_date': (datetime.now() - timedelta(days=45)).isoformat(),  # Stale - warning
            'probability': 20,
            'owner_name': 'Sarah Johnson',
        },
        {
            'id': '3',
            'name': 'Big Enterprise Deal',
            'account_name': 'Enterprise Solutions Ltd',
            'amount': 250000,
            'stage': 'Negotiation',
            'close_date': (datetime.now() + timedelta(days=90)).isoformat(),  # Too far for late stage - warning
            'created_date': (datetime.now() - timedelta(days=5)).isoformat(),
            'last_activity_date': (datetime.now() - timedelta(days=1)).isoformat(),
            'probability': 50,  # Low probability for negotiation stage - warning
            'owner_name': 'Mike Davis',
            'contact_name': 'Bob Wilson',
            'contact_email': 'bob@enterprise.com',
        },
        {
            'id': '4',
            'name': 'Perfect Deal',
            'account_name': 'Perfect Company',
            'amount': 75000,
            'stage': 'Proposal',
            'close_date': (datetime.now() + timedelta(days=25)).isoformat(),
            'created_date': (datetime.now() - timedelta(days=30)).isoformat(),
            'last_activity_date': (datetime.now() - timedelta(days=1)).isoformat(),
            'probability': 60,
            'owner_name': 'Alice Brown',
            'contact_name': 'Charlie Green',
            'contact_email': 'charlie@perfect.com',
            'next_steps': 'Send proposal on Monday',
        },
    ]

    # Analyze all deals
    print("🔍 Analyzing deals...")
    print()
    results = engine.analyze_deals(sample_deals)

    # Print overall results
    print("=" * 80)
    print("📊 Analysis Results:")
    print("=" * 80)
    print(f"  Total deals analyzed: {results['total_deals']}")
    print(f"  Deals with issues: {results['deals_with_issues']}")
    print(f"  Health score: {results['health_score']}/100")
    print(f"  Total violations:")
    print(f"    - Critical: {results['total_critical']}")
    print(f"    - Warnings: {results['total_warnings']}")
    print(f"    - Info: {results['total_info']}")
    print()

    # Print violations by deal
    print("=" * 80)
    print("🚨 Violations by Deal:")
    print("=" * 80)
    print()

    for deal in sample_deals:
        deal_violations = [
            v for v in results['violations']
            if v.get('deal_id') == deal.get('id')
        ]

        if deal_violations:
            print(f"Deal: {deal.get('name') or '(No Name)'} (ID: {deal.get('id')})")
            print(f"  Stage: {deal.get('stage')}")
            print(f"  Violations: {len(deal_violations)}")
            for v in deal_violations:
                print(f"    [{v['severity']}] {v['rule_name']}")
                print(f"      Message: {v['message']}")
                print(f"      Remediation: {v['remediation_action']}")
                print(f"      Owner: {v['remediation_owner']}")
                print()
        else:
            print(f"✅ Deal: {deal.get('name')} - No violations!")
            print()

    # Print violations by category
    print("=" * 80)
    print("📂 Violations by Category:")
    print("=" * 80)
    for category, violations in results['violations_by_category'].items():
        print(f"\n{category}: {len(violations)} violations")
        for v in violations[:3]:  # Show first 3
            print(f"  - {v['rule_name']} (Deal: {v['deal_name'] or v['deal_id']})")
    print()

    # Print remediation plan
    print("=" * 80)
    print("🔧 Remediation Plan (by Owner):")
    print("=" * 80)
    remediation_plan = engine.get_remediation_plan(results['violations'], group_by='owner')
    for owner, violations in remediation_plan.items():
        print(f"\n{owner}: {len(violations)} actions")
        for v in violations[:5]:  # Show first 5
            print(f"  [{v['severity']}] {v['rule_name']}")
            print(f"    Deal: {v['deal_name'] or v['deal_id']}")
            print(f"    Action: {v['remediation_action']}")
    print()

    print("=" * 80)
    print("✅ Test Complete!")
    print("=" * 80)


if __name__ == "__main__":
    test_rules_engine()
