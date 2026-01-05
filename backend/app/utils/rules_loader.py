"""
Load and parse business rules from YAML configuration
"""
import yaml
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class BusinessRule:
    """Represents a single business rule"""
    id: str
    name: str
    category: str
    severity: str
    description: str
    condition: Dict[str, Any]
    message: str
    remediation: str
    remediation_owner: str
    automatable: bool
    applicable_stages: List[str] = None

    def __post_init__(self):
        if self.applicable_stages is None:
            self.applicable_stages = []


class RulesLoader:
    """Loads and manages business rules from YAML configuration"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            # Default to config directory
            base_path = Path(__file__).parent.parent.parent
            config_path = base_path / "config" / "business-rules.yaml"

        self.config_path = Path(config_path)
        self.rules: List[BusinessRule] = []
        self._load_rules()

    def _load_rules(self):
        """Load rules from YAML file"""
        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Load rules from each category
        rule_categories = [
            'data_quality_rules',
            'sales_hygiene_rules',
            'forecasting_rules',
            'progression_rules',
            'engagement_rules',
            'compliance_rules',
        ]

        for category_key in rule_categories:
            if category_key in config:
                for rule_data in config[category_key]:
                    rule = BusinessRule(
                        id=rule_data['id'],
                        name=rule_data['name'],
                        category=rule_data['category'],
                        severity=rule_data['severity'],
                        description=rule_data['description'],
                        condition=rule_data['condition'],
                        message=rule_data['message'],
                        remediation=rule_data['remediation'],
                        remediation_owner=rule_data['remediation_owner'],
                        automatable=rule_data.get('automatable', False),
                        applicable_stages=rule_data.get('applicable_stages', [])
                    )
                    self.rules.append(rule)

    def get_all_rules(self) -> List[BusinessRule]:
        """Get all loaded rules"""
        return self.rules

    def get_rules_by_category(self, category: str) -> List[BusinessRule]:
        """Get rules for a specific category"""
        return [rule for rule in self.rules if rule.category == category]

    def get_rule_by_id(self, rule_id: str) -> BusinessRule:
        """Get a specific rule by ID"""
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        raise ValueError(f"Rule not found: {rule_id}")

    def get_rules_for_stage(self, stage: str) -> List[BusinessRule]:
        """Get rules applicable to a specific stage"""
        applicable_rules = []

        # Safely convert stage to string (could be float/int from Excel)
        stage_str = str(stage).strip() if stage is not None else ''

        for rule in self.rules:
            # If no stages specified, rule applies to all stages
            if not rule.applicable_stages:
                applicable_rules.append(rule)
            # Check if stage is in applicable stages
            elif stage_str in rule.applicable_stages:
                applicable_rules.append(rule)
            # Check for special keywords
            elif 'all_except_closed' in rule.applicable_stages:
                if stage_str.lower() not in ['closed won', 'closed lost', 'closed-won', 'closed-lost']:
                    applicable_rules.append(rule)

        return applicable_rules
