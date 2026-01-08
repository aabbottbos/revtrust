"""
Pydantic models for business rules API.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ===========================================
# ENUMS
# ===========================================

class RuleCategory(str, Enum):
    DATA_QUALITY = "DATA_QUALITY"
    SALES_HYGIENE = "SALES_HYGIENE"
    FORECASTING = "FORECASTING"
    PROGRESSION = "PROGRESSION"
    ENGAGEMENT = "ENGAGEMENT"
    COMPLIANCE = "COMPLIANCE"


class RuleSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class RuleOwner(str, Enum):
    REP = "Rep"
    MANAGER = "Manager"
    AUTO = "Auto"


class RuleScope(str, Enum):
    GLOBAL = "global"
    USER = "user"
    ORG = "org"


# ===========================================
# RULE CONDITION MODELS
# ===========================================

class SimpleCondition(BaseModel):
    """A simple rule condition: field + operator + optional value."""
    field: str
    operator: str  # is_empty, older_than_days, greater_than, etc.
    value: Optional[Any] = None


class CompoundCondition(BaseModel):
    """A compound condition with 'all' or 'any' sub-conditions."""
    all_conditions: Optional[List["RuleCondition"]] = Field(None, alias="all")
    any_conditions: Optional[List["RuleCondition"]] = Field(None, alias="any")

    class Config:
        populate_by_name = True


# Union type for conditions
RuleCondition = SimpleCondition | CompoundCondition | Dict[str, Any]


# ===========================================
# RULE RESPONSE MODELS
# ===========================================

class RuleResponse(BaseModel):
    """Response model for a business rule (global or custom)."""
    id: str
    ruleId: str
    name: str
    category: RuleCategory
    severity: RuleSeverity
    description: str
    condition: Dict[str, Any]
    message: str
    remediation: Optional[str] = None
    remediationOwner: Optional[str] = None
    automatable: bool = False
    applicableStages: List[str] = []
    priority: int = 0
    enabled: bool = True

    # Scope information
    scope: RuleScope  # global, user, or org
    userId: Optional[str] = None
    orgId: Optional[str] = None

    # Override info (for global rules)
    isOverridden: bool = False
    overrideDetails: Optional[Dict[str, Any]] = None

    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class GlobalRuleResponse(BaseModel):
    """Response model for a global rule with override status."""
    ruleId: str
    name: str
    category: RuleCategory
    severity: RuleSeverity
    description: str
    condition: Dict[str, Any]
    message: str
    remediation: Optional[str] = None
    remediationOwner: Optional[str] = None
    automatable: bool = False
    applicableStages: List[str] = []

    # Override status
    enabled: bool = True
    isOverridden: bool = False
    thresholdOverrides: Optional[Dict[str, Any]] = None
    effectiveCondition: Optional[Dict[str, Any]] = None  # Condition with overrides applied


class CustomRuleResponse(BaseModel):
    """Response model for a custom rule."""
    id: str
    ruleId: str
    name: str
    category: RuleCategory
    severity: RuleSeverity
    description: str
    condition: Dict[str, Any]
    message: str
    remediation: Optional[str] = None
    remediationOwner: Optional[str] = None
    automatable: bool = False
    applicableStages: List[str] = []
    priority: int = 0
    enabled: bool = True

    # Ownership
    userId: Optional[str] = None
    orgId: Optional[str] = None

    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ===========================================
# RULE REQUEST MODELS
# ===========================================

class CustomRuleCreate(BaseModel):
    """Request model for creating a custom rule."""
    ruleId: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    name: str = Field(..., min_length=1, max_length=200)
    category: RuleCategory
    severity: RuleSeverity
    description: str = Field(..., min_length=1, max_length=500)
    condition: Dict[str, Any]
    message: str = Field(..., min_length=1, max_length=500)
    remediation: Optional[str] = Field(None, max_length=500)
    remediationOwner: Optional[RuleOwner] = None
    automatable: bool = False
    applicableStages: List[str] = []
    priority: int = Field(0, ge=0, le=100)
    enabled: bool = True

    # For org-level rules
    orgId: Optional[str] = None


class CustomRuleUpdate(BaseModel):
    """Request model for updating a custom rule."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[RuleCategory] = None
    severity: Optional[RuleSeverity] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    condition: Optional[Dict[str, Any]] = None
    message: Optional[str] = Field(None, min_length=1, max_length=500)
    remediation: Optional[str] = Field(None, max_length=500)
    remediationOwner: Optional[RuleOwner] = None
    automatable: Optional[bool] = None
    applicableStages: Optional[List[str]] = None
    priority: Optional[int] = Field(None, ge=0, le=100)
    enabled: Optional[bool] = None


class GlobalRuleOverrideCreate(BaseModel):
    """Request model for overriding a global rule."""
    enabled: bool = True
    thresholdOverrides: Optional[Dict[str, Any]] = None  # {"value": 45}

    # For org-level overrides
    orgId: Optional[str] = None


class GlobalRuleOverrideUpdate(BaseModel):
    """Request model for updating a global rule override."""
    enabled: Optional[bool] = None
    thresholdOverrides: Optional[Dict[str, Any]] = None


# ===========================================
# AGGREGATED RESPONSE MODELS
# ===========================================

class RulesListResponse(BaseModel):
    """Response model for listing all effective rules."""
    globalRules: List[GlobalRuleResponse]
    customRules: List[CustomRuleResponse]
    totalGlobal: int
    totalCustom: int
    totalEnabled: int
    totalDisabled: int


class RulesSummary(BaseModel):
    """Summary of rules by category and severity."""
    totalRules: int
    byCategory: Dict[str, int]
    bySeverity: Dict[str, int]
    byScope: Dict[str, int]


# ===========================================
# OPERATOR AND FIELD METADATA
# ===========================================

class OperatorInfo(BaseModel):
    """Information about a rule operator."""
    name: str
    description: str
    requiresValue: bool
    valueType: Optional[str] = None  # "number", "string", "date", "list"
    example: Optional[str] = None


class FieldInfo(BaseModel):
    """Information about a deal field that can be used in rules."""
    name: str
    displayName: str
    dataType: str  # "string", "number", "date", "currency"
    description: Optional[str] = None
    commonOperators: List[str] = []


class RuleMetadata(BaseModel):
    """Metadata for building rules in the UI."""
    operators: List[OperatorInfo]
    fields: List[FieldInfo]
    categories: List[str]
    severities: List[str]
    stages: List[str]
