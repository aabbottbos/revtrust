"""
Rule evaluator - evaluates business rules against deal data
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from .rule_operators import evaluate_operator
from .rules_loader import BusinessRule


@dataclass
class Violation:
    """Represents a rule violation"""
    rule_id: str
    rule_name: str
    category: str
    severity: str
    message: str
    field_name: Optional[str]
    current_value: Optional[str]
    expected_value: Optional[str]
    remediation_action: str
    remediation_owner: str
    automatable: bool


class RuleEvaluator:
    """Evaluates business rules against deal data"""

    def __init__(self):
        pass

    def evaluate_condition(self, condition: Dict[str, Any], deal_data: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition against deal data

        Condition can be:
        - Simple: {"field": "name", "operator": "is_empty"}
        - With value: {"field": "amount", "operator": "greater_than", "value": 10000}
        - Compound (all): {"all": [condition1, condition2, ...]}
        - Compound (any): {"any": [condition1, condition2, ...]}
        """

        # Handle compound conditions with 'all'
        if 'all' in condition:
            return all(
                self.evaluate_condition(sub_cond, deal_data)
                for sub_cond in condition['all']
            )

        # Handle compound conditions with 'any'
        if 'any' in condition:
            return any(
                self.evaluate_condition(sub_cond, deal_data)
                for sub_cond in condition['any']
            )

        # Simple condition
        field = condition.get('field')
        operator = condition.get('operator')
        threshold = condition.get('value')

        if not field or not operator:
            raise ValueError(f"Condition must have 'field' and 'operator': {condition}")

        # Get field value from deal data (support snake_case in YAML)
        field_value = deal_data.get(field)
        if field_value is None and '_' in field:
            # Try camelCase version
            camel_field = ''.join(
                word.capitalize() if i > 0 else word
                for i, word in enumerate(field.split('_'))
            )
            field_value = deal_data.get(camel_field)

        # Evaluate the operator
        return evaluate_operator(operator, field_value, threshold)

    def evaluate_rule(self, rule: BusinessRule, deal_data: Dict[str, Any]) -> Optional[Violation]:
        """
        Evaluate a single rule against deal data

        Returns:
            Violation object if rule is violated, None otherwise
        """
        try:
            # Check if rule applies to this deal's stage
            if rule.applicable_stages:
                deal_stage = deal_data.get('stage', '')
                is_closed = deal_stage.lower() in ['closed won', 'closed lost', 'closed-won', 'closed-lost']

                # Skip if rule is for non-closed deals only
                if 'all_except_closed' in rule.applicable_stages and is_closed:
                    return None

                # Skip if deal stage not in applicable stages
                if deal_stage not in rule.applicable_stages and 'all_except_closed' not in rule.applicable_stages:
                    return None

            # Evaluate the condition
            is_violated = self.evaluate_condition(rule.condition, deal_data)

            if is_violated:
                # Extract field info for violation
                field_name = self._extract_field_name(rule.condition)
                current_value = self._get_field_value(deal_data, field_name) if field_name else None
                expected_value = self._extract_expected_value(rule.condition)

                return Violation(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    category=rule.category,
                    severity=rule.severity,
                    message=rule.message,
                    field_name=field_name,
                    current_value=str(current_value) if current_value is not None else None,
                    expected_value=expected_value,
                    remediation_action=rule.remediation,
                    remediation_owner=rule.remediation_owner,
                    automatable=rule.automatable
                )

            return None

        except Exception as e:
            print(f"Error evaluating rule {rule.id}: {str(e)}")
            return None

    def evaluate_all_rules(
        self,
        rules: List[BusinessRule],
        deal_data: Dict[str, Any]
    ) -> List[Violation]:
        """
        Evaluate all rules against deal data

        Returns:
            List of violations found
        """
        violations = []

        for rule in rules:
            violation = self.evaluate_rule(rule, deal_data)
            if violation:
                violations.append(violation)

        return violations

    def _extract_field_name(self, condition: Dict[str, Any]) -> Optional[str]:
        """Extract the primary field name from a condition"""
        if 'field' in condition:
            return condition['field']
        if 'all' in condition and len(condition['all']) > 0:
            return self._extract_field_name(condition['all'][0])
        if 'any' in condition and len(condition['any']) > 0:
            return self._extract_field_name(condition['any'][0])
        return None

    def _extract_expected_value(self, condition: Dict[str, Any]) -> Optional[str]:
        """Extract expected value from condition if present"""
        if 'value' in condition:
            value = condition['value']
            if isinstance(value, list):
                return ', '.join(str(v) for v in value)
            return str(value)
        return None

    def _get_field_value(self, deal_data: Dict[str, Any], field_name: str) -> Any:
        """Get field value, trying both snake_case and camelCase"""
        value = deal_data.get(field_name)
        if value is None and '_' in field_name:
            # Try camelCase
            camel_field = ''.join(
                word.capitalize() if i > 0 else word
                for i, word in enumerate(field_name.split('_'))
            )
            value = deal_data.get(camel_field)
        return value
