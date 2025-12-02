"""
Business Rules Engine - Main orchestrator for rule evaluation
"""
from typing import List, Dict, Any, Tuple
from dataclasses import asdict
from .rules_loader import RulesLoader, BusinessRule
from .rule_evaluator import RuleEvaluator, Violation


class BusinessRulesEngine:
    """
    Main business rules engine that coordinates rule loading,
    evaluation, and violation detection
    """

    def __init__(self, config_path: str = None):
        """
        Initialize the business rules engine

        Args:
            config_path: Optional path to business rules YAML file
        """
        self.rules_loader = RulesLoader(config_path)
        self.rule_evaluator = RuleEvaluator()

    def analyze_deal(self, deal_data: Dict[str, Any]) -> Tuple[List[Violation], Dict[str, int]]:
        """
        Analyze a single deal against all applicable rules

        Args:
            deal_data: Dictionary containing deal information

        Returns:
            Tuple of (violations list, summary dict)
        """
        # Get all rules
        all_rules = self.rules_loader.get_all_rules()

        # Filter rules by stage if applicable
        deal_stage = deal_data.get('stage')
        if deal_stage:
            applicable_rules = self.rules_loader.get_rules_for_stage(deal_stage)
        else:
            applicable_rules = all_rules

        # Evaluate all applicable rules
        violations = self.rule_evaluator.evaluate_all_rules(applicable_rules, deal_data)

        # Generate summary
        summary = self._generate_violation_summary(violations)

        return violations, summary

    def analyze_deals(self, deals_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze multiple deals against all applicable rules

        Args:
            deals_data: List of dictionaries containing deal information

        Returns:
            Dictionary with analysis results
        """
        all_violations = []
        deals_with_violations = 0
        total_critical = 0
        total_warnings = 0
        total_info = 0

        # Analyze each deal
        for deal in deals_data:
            violations, summary = self.analyze_deal(deal)

            if violations:
                deals_with_violations += 1
                total_critical += summary['critical']
                total_warnings += summary['warning']
                total_info += summary['info']

            # Attach violations to deal
            all_violations.extend([
                {
                    'deal_id': deal.get('deal_id') or deal.get('id') or deal.get('external_id'),
                    'deal_name': deal.get('deal_name'),
                    **asdict(v)
                }
                for v in violations
            ])

        # Calculate health score (0-100)
        total_deals = len(deals_data)
        if total_deals > 0:
            # Health score based on percentage of clean deals and severity of issues
            clean_deals_pct = ((total_deals - deals_with_violations) / total_deals) * 100
            severity_penalty = (total_critical * 5 + total_warnings * 2 + total_info * 0.5)
            max_penalty = total_deals * 10  # Normalize penalty
            penalty_pct = min((severity_penalty / max_penalty) * 100, 100) if max_penalty > 0 else 0
            health_score = max(0, clean_deals_pct - penalty_pct)
        else:
            health_score = 0

        return {
            'total_deals': total_deals,
            'deals_with_issues': deals_with_violations,
            'health_score': round(health_score, 2),
            'total_critical': total_critical,
            'total_warnings': total_warnings,
            'total_info': total_info,
            'violations': all_violations,
            'violations_by_category': self._group_violations_by_category(all_violations),
            'violations_by_severity': self._group_violations_by_severity(all_violations),
        }

    def get_remediation_plan(
        self,
        violations: List[Dict[str, Any]],
        group_by: str = 'owner'
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate a remediation plan grouped by owner or category

        Args:
            violations: List of violation dictionaries
            group_by: 'owner' or 'category'

        Returns:
            Dictionary grouped by the specified key
        """
        if group_by == 'owner':
            return self._group_by_owner(violations)
        elif group_by == 'category':
            return self._group_violations_by_category(violations)
        else:
            raise ValueError(f"Invalid group_by value: {group_by}")

    def _generate_violation_summary(self, violations: List[Violation]) -> Dict[str, int]:
        """Generate summary counts by severity"""
        summary = {
            'critical': 0,
            'warning': 0,
            'info': 0,
            'total': len(violations)
        }

        for violation in violations:
            severity_key = violation.severity.lower()
            if severity_key in summary:
                summary[severity_key] += 1

        return summary

    def _group_violations_by_category(self, violations: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group violations by category"""
        grouped = {}
        for violation in violations:
            category = violation.get('category', 'UNKNOWN')
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(violation)
        return grouped

    def _group_violations_by_severity(self, violations: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group violations by severity"""
        grouped = {
            'CRITICAL': [],
            'WARNING': [],
            'INFO': []
        }
        for violation in violations:
            severity = violation.get('severity', 'INFO')
            if severity in grouped:
                grouped[severity].append(violation)
        return grouped

    def _group_by_owner(self, violations: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group violations by remediation owner"""
        grouped = {}
        for violation in violations:
            owner = violation.get('remediation_owner', 'Unknown')
            if owner not in grouped:
                grouped[owner] = []
            grouped[owner].append(violation)
        return grouped

    def get_all_rules(self) -> List[BusinessRule]:
        """Get all loaded business rules"""
        return self.rules_loader.get_all_rules()

    def get_rules_summary(self) -> Dict[str, Any]:
        """Get summary of all loaded rules"""
        all_rules = self.rules_loader.get_all_rules()

        categories = {}
        severities = {'CRITICAL': 0, 'WARNING': 0, 'INFO': 0}

        for rule in all_rules:
            # Count by category
            if rule.category not in categories:
                categories[rule.category] = 0
            categories[rule.category] += 1

            # Count by severity
            if rule.severity in severities:
                severities[rule.severity] += 1

        return {
            'total_rules': len(all_rules),
            'by_category': categories,
            'by_severity': severities,
        }
