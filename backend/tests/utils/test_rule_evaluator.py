
import pytest
from app.utils.rule_evaluator import RuleEvaluator, Violation
from app.utils.rules_loader import BusinessRule

@pytest.fixture
def evaluator():
    return RuleEvaluator()

def test_evaluate_condition_simple(evaluator):
    deal_data = {'amount': 100}
    
    # Matching condition
    condition = {'field': 'amount', 'operator': 'greater_than', 'value': 50}
    assert evaluator.evaluate_condition(condition, deal_data) is True
    
    # Non-matching condition
    condition = {'field': 'amount', 'operator': 'greater_than', 'value': 150}
    assert evaluator.evaluate_condition(condition, deal_data) is False

def test_evaluate_condition_camel_case_fallback(evaluator):
    deal_data = {'closeDate': '2023-01-01'}
    
    # snake_case in rule, camelCase in data
    condition = {'field': 'close_date', 'operator': 'is_past'}
    # Note: is_past checks against today. Assuming 2023-01-01 is past.
    assert evaluator.evaluate_condition(condition, deal_data) is True

def test_evaluate_compound_condition_all(evaluator):
    deal_data = {'amount': 100, 'stage': 'Closed Won'}
    
    condition = {
        'all': [
            {'field': 'amount', 'operator': 'greater_than', 'value': 50},
            {'field': 'stage', 'operator': 'equals', 'value': 'Closed Won'}
        ]
    }
    assert evaluator.evaluate_condition(condition, deal_data) is True
    
    condition_fail = {
        'all': [
            {'field': 'amount', 'operator': 'greater_than', 'value': 150}, # Fails
            {'field': 'stage', 'operator': 'equals', 'value': 'Closed Won'}
        ]
    }
    assert evaluator.evaluate_condition(condition_fail, deal_data) is False

def test_evaluate_compound_condition_any(evaluator):
    deal_data = {'amount': 100, 'stage': 'Discovery'}
    
    condition = {
        'any': [
            {'field': 'amount', 'operator': 'greater_than', 'value': 150}, # Fails
            {'field': 'stage', 'operator': 'equals', 'value': 'Discovery'} # Passes
        ]
    }
    assert evaluator.evaluate_condition(condition, deal_data) is True

def test_evaluate_rule_violation(evaluator):
    deal_data = {'amount': 0}
    rule = BusinessRule(
        id="R1", name="Zero Amount", category="DQ", severity="CRITICAL",
        description="Amount cannot be zero",
        condition={'field': 'amount', 'operator': 'is_null_or_zero'},
        message="Amount is zero",
        remediation="Update amount",
        remediation_owner="Rep",
        automatable=False
    )
    
    violation = evaluator.evaluate_rule(rule, deal_data)
    
    assert violation is not None
    assert isinstance(violation, Violation)
    assert violation.rule_id == "R1"
    assert violation.field_name == "amount"
    assert violation.current_value == "0"

def test_evaluate_rule_no_violation(evaluator):
    deal_data = {'amount': 100}
    rule = BusinessRule(
        id="R1", name="Zero Amount", category="DQ", severity="CRITICAL",
        description="Amount cannot be zero",
        condition={'field': 'amount', 'operator': 'is_null_or_zero'},
        message="Amount is zero",
        remediation="Update amount",
        remediation_owner="Rep",
        automatable=False
    )
    
    violation = evaluator.evaluate_rule(rule, deal_data)
    assert violation is None

def test_evaluate_rule_applicable_stages(evaluator):
    rule = BusinessRule(
        id="R1", name="Test", category="Test", severity="INFO", description="Test",
        condition={'field': 'amount', 'operator': 'is_null_or_zero'},
        message="Test", remediation="Test", remediation_owner="Test", automatable=False,
        applicable_stages=['Proposal', 'Negotiation']
    )
    
    # Deal in applicable stage -> should evaluate (and violate because amount is missing/None)
    deal_in_stage = {'stage': 'Proposal', 'amount': 0}
    assert evaluator.evaluate_rule(rule, deal_in_stage) is not None
    
    # Deal NOT in applicable stage -> should skip (return None)
    deal_out_stage = {'stage': 'Discovery', 'amount': 0}
    assert evaluator.evaluate_rule(rule, deal_out_stage) is None

def test_evaluate_rule_all_except_closed(evaluator):
    rule = BusinessRule(
        id="R1", name="Test", category="Test", severity="INFO", description="Test",
        condition={'field': 'amount', 'operator': 'is_null_or_zero'},
        message="Test", remediation="Test", remediation_owner="Test", automatable=False,
        applicable_stages=['all_except_closed']
    )
    
    # Open deal -> should evaluate
    assert evaluator.evaluate_rule(rule, {'stage': 'Discovery', 'amount': 0}) is not None
    
    # Closed deal -> should skip
    assert evaluator.evaluate_rule(rule, {'stage': 'Closed Won', 'amount': 0}) is None
    assert evaluator.evaluate_rule(rule, {'stage': 'Closed Lost', 'amount': 0}) is None
