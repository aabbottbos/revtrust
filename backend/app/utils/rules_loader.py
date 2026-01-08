"""
Load and parse business rules from YAML configuration and database
"""
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from copy import deepcopy


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
    priority: int = 0
    enabled: bool = True
    # Source tracking
    scope: str = "global"  # "global", "user", "org"
    user_id: Optional[str] = None
    org_id: Optional[str] = None

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
                        applicable_stages=rule_data.get('applicable_stages', []),
                        scope="global"
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


class ContextualRulesLoader:
    """
    Enhanced rules loader that supports user/org context.
    Loads global rules from YAML, custom rules from database,
    and applies user/org overrides to global rules.
    """

    def __init__(self, config_path: str = None):
        if config_path is None:
            base_path = Path(__file__).parent.parent.parent
            config_path = base_path / "config" / "business-rules.yaml"

        self.config_path = Path(config_path)
        self.global_rules: List[BusinessRule] = []
        self.custom_rules: List[BusinessRule] = []
        self.overrides: Dict[str, Dict[str, Any]] = {}  # rule_id -> override data
        self._load_global_rules()

    def _load_global_rules(self):
        """Load global rules from YAML file"""
        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)

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
                        applicable_stages=rule_data.get('applicable_stages', []),
                        scope="global"
                    )
                    self.global_rules.append(rule)

    async def load_context(self, db, user_id: Optional[str] = None, org_id: Optional[str] = None):
        """
        Load custom rules and overrides for a specific user/org context.

        Args:
            db: Prisma database instance
            user_id: User ID for user-specific rules
            org_id: Organization ID for org-specific rules
        """
        self.custom_rules = []
        self.overrides = {}

        if not user_id and not org_id:
            return

        # Load global rule overrides
        # Priority: user overrides > org overrides
        if org_id:
            org_overrides = await db.globalruleoverride.find_many(
                where={"orgId": org_id}
            )
            for override in org_overrides:
                self.overrides[override.globalRuleId] = {
                    "enabled": override.enabled,
                    "threshold_overrides": override.thresholdOverrides,
                    "source": "org"
                }

        if user_id:
            user_overrides = await db.globalruleoverride.find_many(
                where={"userId": user_id}
            )
            # User overrides take precedence over org overrides
            for override in user_overrides:
                self.overrides[override.globalRuleId] = {
                    "enabled": override.enabled,
                    "threshold_overrides": override.thresholdOverrides,
                    "source": "user"
                }

        # Load custom rules
        # Org rules first, then user rules (user rules have higher priority)
        if org_id:
            org_rules = await db.customrule.find_many(
                where={"orgId": org_id, "enabled": True},
                order={"priority": "desc"}
            )
            for rule in org_rules:
                self.custom_rules.append(BusinessRule(
                    id=rule.ruleId,
                    name=rule.name,
                    category=rule.category,
                    severity=rule.severity,
                    description=rule.description,
                    condition=rule.condition,
                    message=rule.message,
                    remediation=rule.remediation or "",
                    remediation_owner=rule.remediationOwner or "Rep",
                    automatable=rule.automatable,
                    applicable_stages=rule.applicableStages or [],
                    priority=rule.priority,
                    enabled=rule.enabled,
                    scope="org",
                    org_id=rule.orgId
                ))

        if user_id:
            user_rules = await db.customrule.find_many(
                where={"userId": user_id, "enabled": True},
                order={"priority": "desc"}
            )
            for rule in user_rules:
                self.custom_rules.append(BusinessRule(
                    id=rule.ruleId,
                    name=rule.name,
                    category=rule.category,
                    severity=rule.severity,
                    description=rule.description,
                    condition=rule.condition,
                    message=rule.message,
                    remediation=rule.remediation or "",
                    remediation_owner=rule.remediationOwner or "Rep",
                    automatable=rule.automatable,
                    applicable_stages=rule.applicableStages or [],
                    priority=rule.priority,
                    enabled=rule.enabled,
                    scope="user",
                    user_id=rule.userId
                ))

    def get_effective_rules(self) -> List[BusinessRule]:
        """
        Get the effective list of rules with overrides applied.

        Returns:
            List of BusinessRule objects in priority order:
            1. Enabled global rules (with overrides applied)
            2. Org-level custom rules
            3. User-level custom rules
        """
        effective_rules = []

        # Process global rules with overrides
        for rule in self.global_rules:
            override = self.overrides.get(rule.id)

            if override:
                # Check if rule is disabled
                if not override.get("enabled", True):
                    continue

                # Apply threshold overrides if present
                threshold_overrides = override.get("threshold_overrides")
                if threshold_overrides:
                    modified_rule = self._apply_threshold_overrides(rule, threshold_overrides)
                    effective_rules.append(modified_rule)
                else:
                    effective_rules.append(rule)
            else:
                # No override, use rule as-is
                effective_rules.append(rule)

        # Add custom rules (already filtered by enabled in load_context)
        effective_rules.extend(self.custom_rules)

        return effective_rules

    def _apply_threshold_overrides(self, rule: BusinessRule, overrides: Dict[str, Any]) -> BusinessRule:
        """
        Apply threshold overrides to a rule's condition.

        Args:
            rule: Original BusinessRule
            overrides: Dictionary of overrides (e.g., {"value": 45})

        Returns:
            New BusinessRule with modified condition
        """
        modified_condition = self._apply_overrides_to_condition(
            deepcopy(rule.condition),
            overrides
        )

        return BusinessRule(
            id=rule.id,
            name=rule.name,
            category=rule.category,
            severity=rule.severity,
            description=rule.description,
            condition=modified_condition,
            message=rule.message,
            remediation=rule.remediation,
            remediation_owner=rule.remediation_owner,
            automatable=rule.automatable,
            applicable_stages=rule.applicable_stages,
            priority=rule.priority,
            enabled=rule.enabled,
            scope=rule.scope,
            user_id=rule.user_id,
            org_id=rule.org_id
        )

    def _apply_overrides_to_condition(self, condition: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively apply overrides to a condition."""
        # Handle simple condition with value
        if "value" in overrides and "value" in condition:
            condition["value"] = overrides["value"]

        # Handle compound conditions
        if "all" in condition and isinstance(condition["all"], list):
            condition["all"] = [
                self._apply_overrides_to_condition(c, overrides) if isinstance(c, dict) else c
                for c in condition["all"]
            ]

        if "any" in condition and isinstance(condition["any"], list):
            condition["any"] = [
                self._apply_overrides_to_condition(c, overrides) if isinstance(c, dict) else c
                for c in condition["any"]
            ]

        return condition

    def get_rules_for_stage(self, stage: str) -> List[BusinessRule]:
        """Get effective rules applicable to a specific stage"""
        effective_rules = self.get_effective_rules()
        applicable_rules = []

        stage_str = str(stage).strip() if stage is not None else ''

        for rule in effective_rules:
            if not rule.applicable_stages:
                applicable_rules.append(rule)
            elif stage_str in rule.applicable_stages:
                applicable_rules.append(rule)
            elif 'all_except_closed' in rule.applicable_stages:
                if stage_str.lower() not in ['closed won', 'closed lost', 'closed-won', 'closed-lost']:
                    applicable_rules.append(rule)

        return applicable_rules

    def get_all_rules(self) -> List[BusinessRule]:
        """Get all global rules (for backward compatibility)"""
        return self.global_rules

    def get_rule_by_id(self, rule_id: str) -> BusinessRule:
        """Get a specific global rule by ID"""
        for rule in self.global_rules:
            if rule.id == rule_id:
                return rule
        raise ValueError(f"Rule not found: {rule_id}")

    def get_rules_by_category(self, category: str) -> List[BusinessRule]:
        """Get effective rules for a specific category"""
        return [rule for rule in self.get_effective_rules() if rule.category == category]
