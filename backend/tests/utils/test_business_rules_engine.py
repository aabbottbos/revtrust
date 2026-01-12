
import pytest
from unittest.mock import Mock, patch
from app.utils.business_rules_engine import BusinessRulesEngine, Violation, BusinessRule

@pytest.fixture
def mock_rules_loader():
    with patch('app.utils.business_rules_engine.RulesLoader') as mock:
        loader_instance = mock.return_value
        loader_instance.get_all_rules.return_value = []
        loader_instance.get_rules_for_stage.return_value = []
        yield loader_instance

@pytest.fixture
def mock_rule_evaluator():
    with patch('app.utils.business_rules_engine.RuleEvaluator') as mock:
        yield mock.return_value

@pytest.fixture
def engine(mock_rules_loader, mock_rule_evaluator):
    return BusinessRulesEngine()

def test_analyze_deal_no_violations(engine, mock_rules_loader, mock_rule_evaluator):
    # Setup
    deal_data = {'id': '1', 'name': 'Test Deal', 'stage': 'Discovery'}
    mock_rule_evaluator.evaluate_all_rules.return_value = []
    
    # Execute
    violations, summary = engine.analyze_deal(deal_data)
    
    # Verify
    assert violations == []
    assert summary['total'] == 0
    assert summary['critical'] == 0
    
    # Verify rules were fetched based on stage
    mock_rules_loader.get_rules_for_stage.assert_called_with('Discovery')
    mock_rule_evaluator.evaluate_all_rules.assert_called()

def test_analyze_deal_with_violations(engine, mock_rule_evaluator):
    # Setup
    deal_data = {'id': '1', 'stage': 'Discovery'}
    
    violation = Violation(
        rule_id="RULE-001",
        rule_name="Test Rule",
        category="DATA_QUALITY",
        severity="CRITICAL",
        message="Error",
        field_name="amount",
        current_value="0",
        expected_value=">0",
        remediation_action="Fix it",
        remediation_owner="Rep",
        automatable=False
    )
    mock_rule_evaluator.evaluate_all_rules.return_value = [violation]
    
    # Execute
    violations, summary = engine.analyze_deal(deal_data)
    
    # Verify
    assert len(violations) == 1
    assert summary['total'] == 1
    assert summary['critical'] == 1
    assert summary['warning'] == 0

def test_analyze_deals_aggregation(engine):
    # Setup
    deals = [
        {'id': '1', 'name': 'Deal 1'},
        {'id': '2', 'name': 'Deal 2'}
    ]
    
    # Mock evaluate_deal to return violations for second deal only
    def side_effect(deal):
        if deal['id'] == '1':
            return [], {'critical': 0, 'warning': 0, 'info': 0, 'total': 0}
        else:
            v = Violation(
                rule_id="R1", rule_name="Rule", category="CAT", severity="CRITICAL",
                message="Msg", field_name="f", current_value="v", expected_value="e",
                remediation_action="act", remediation_owner="owner", automatable=False
            )
            return [v], {'critical': 1, 'warning': 0, 'info': 0, 'total': 1}
            
    with patch.object(engine, 'analyze_deal', side_effect=side_effect):
        results = engine.analyze_deals(deals)
        
        assert results['total_deals'] == 2
        assert results['deals_with_issues'] == 1
        assert results['health_score'] == 25.0  # (1 clean / 2 total) * 100 = 50% - 25% penalty
        assert len(results['violations']) == 1
        assert results['violations'][0]['deal_id'] == '2'

def test_health_score_calculation(engine):
    # Test perfect score
    with patch.object(engine, 'analyze_deal', return_value=([], {'critical':0, 'warning':0, 'info':0})):
        results = engine.analyze_deals([{'id': '1'}])
        assert results['health_score'] == 100.0

    # Test zero score (all critical)
    # 1 deal, 1 critical violation -> 50% base - penalty
    # This logic depends deeply on the implementation details:
    # clean_deals_pct = 0%
    # penalty = critical(1)*5
    # max_penalty = 1*10 = 10
    # penalty_pct = 50%
    # score = 0 - 50 = 0 (max(0, ...))
    # Wait, clean deal logic in code: ((total - with_issues) / total) * 100
    # If 1 deal has issues, clean_deals_pct = 0.
    
    violation = Violation(
        rule_id="R1", rule_name="R", category="C", severity="CRITICAL",
        message="M", field_name="F", current_value="V", expected_value="E",
        remediation_action="A", remediation_owner="O", automatable=False
    )
    
    with patch.object(engine, 'analyze_deal', return_value=([violation], {'critical':1, 'warning':0, 'info':0})):
        results = engine.analyze_deals([{'id': '1'}])
        assert results['health_score'] == 0.0

def test_group_remediation_plan(engine):
    violations = [
        {'remediation_owner': 'Rep', 'id': '1'},
        {'remediation_owner': 'Manager', 'id': '2'},
        {'remediation_owner': 'Rep', 'id': '3'}
    ]
    
    plan = engine.get_remediation_plan(violations, group_by='owner')
    
    assert len(plan['Rep']) == 2
    assert len(plan['Manager']) == 1
