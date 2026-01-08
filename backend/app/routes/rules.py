"""
API endpoints for business rules management.
Allows users to view, create, and manage custom rules and override global rules.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from prisma import Prisma

from app.auth import require_auth
from app.utils.permissions import OrgPermissions
from app.utils.rules_loader import RulesLoader
from app.models.rules import (
    RuleCategory,
    RuleSeverity,
    RuleScope,
    GlobalRuleResponse,
    CustomRuleResponse,
    CustomRuleCreate,
    CustomRuleUpdate,
    GlobalRuleOverrideCreate,
    GlobalRuleOverrideUpdate,
    RulesListResponse,
    RulesSummary,
    OperatorInfo,
    FieldInfo,
    RuleMetadata,
)


router = APIRouter(prefix="/api/rules", tags=["Rules"])

# Subscription tiers that can manage rules
PAID_TIERS = ["pro", "team", "enterprise"]


async def get_user_from_clerk_id(db: Prisma, clerk_id: str):
    """Get database user from Clerk ID."""
    user = await db.user.find_unique(where={"clerkId": clerk_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure you have an account."
        )
    return user


async def require_paid_tier(db: Prisma, user_id: str, allow_read: bool = False):
    """Ensure user has a paid subscription tier."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.subscriptionTier not in PAID_TIERS:
        if allow_read:
            return False  # Return False to indicate read-only access
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Custom rules require a paid subscription (Pro, Team, or Enterprise)"
        )
    return True


async def get_user_org_id(db: Prisma, user_id: str) -> Optional[str]:
    """Get the user's organization ID if they belong to one."""
    membership = await db.orgmembership.find_first(
        where={"userId": user_id, "isActive": True}
    )
    return membership.orgId if membership else None


# ===========================================
# LIST RULES
# ===========================================

@router.get("", response_model=RulesListResponse)
async def list_all_rules(
    category: Optional[RuleCategory] = Query(None),
    severity: Optional[RuleSeverity] = Query(None),
    enabled_only: bool = Query(False),
    clerk_id: str = Depends(require_auth)
):
    """
    List all rules (global + custom) for the current user.
    Returns global rules with their override status, plus user's custom rules.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id)

        # Load global rules from YAML
        rules_loader = RulesLoader()
        global_rules_raw = rules_loader.get_all_rules()

        # Get user's global rule overrides
        user_overrides = await db.globalruleoverride.find_many(
            where={"userId": user_id}
        )
        user_override_map = {o.globalRuleId: o for o in user_overrides}

        # Get org's global rule overrides (if user is in an org)
        org_override_map = {}
        if org_id:
            org_overrides = await db.globalruleoverride.find_many(
                where={"orgId": org_id}
            )
            org_override_map = {o.globalRuleId: o for o in org_overrides}

        # Build global rules response with override status
        global_rules = []
        for rule in global_rules_raw:
            # Check for user override first, then org override
            override = user_override_map.get(rule.id) or org_override_map.get(rule.id)

            is_overridden = override is not None
            effective_enabled = override.enabled if override else True
            threshold_overrides = override.thresholdOverrides if override else None

            # Apply filters
            if category and rule.category != category.value:
                continue
            if severity and rule.severity != severity.value:
                continue
            if enabled_only and not effective_enabled:
                continue

            # Calculate effective condition with threshold overrides
            effective_condition = dict(rule.condition)
            if threshold_overrides:
                effective_condition = apply_threshold_overrides(rule.condition, threshold_overrides)

            global_rules.append(GlobalRuleResponse(
                ruleId=rule.id,
                name=rule.name,
                category=RuleCategory(rule.category),
                severity=RuleSeverity(rule.severity),
                description=rule.description,
                condition=rule.condition,
                message=rule.message,
                remediation=rule.remediation,
                remediationOwner=rule.remediation_owner,
                automatable=rule.automatable,
                applicableStages=rule.applicable_stages or [],
                enabled=effective_enabled,
                isOverridden=is_overridden,
                thresholdOverrides=threshold_overrides,
                effectiveCondition=effective_condition if is_overridden else None,
            ))

        # Get user's custom rules
        custom_rules_query = {"userId": user_id}
        if enabled_only:
            custom_rules_query["enabled"] = True

        user_custom_rules = await db.customrule.find_many(
            where=custom_rules_query,
            order={"priority": "desc"}
        )

        # Get org's custom rules (if user is in an org)
        org_custom_rules = []
        if org_id:
            org_rules_query = {"orgId": org_id}
            if enabled_only:
                org_rules_query["enabled"] = True

            org_custom_rules = await db.customrule.find_many(
                where=org_rules_query,
                order={"priority": "desc"}
            )

        # Combine and filter custom rules
        all_custom_rules = user_custom_rules + org_custom_rules
        custom_rules = []
        for rule in all_custom_rules:
            # Apply filters
            if category and rule.category != category.value:
                continue
            if severity and rule.severity != severity.value:
                continue

            custom_rules.append(CustomRuleResponse(
                id=rule.id,
                ruleId=rule.ruleId,
                name=rule.name,
                category=RuleCategory(rule.category),
                severity=RuleSeverity(rule.severity),
                description=rule.description,
                condition=rule.condition,
                message=rule.message,
                remediation=rule.remediation,
                remediationOwner=rule.remediationOwner,
                automatable=rule.automatable,
                applicableStages=rule.applicableStages or [],
                priority=rule.priority,
                enabled=rule.enabled,
                userId=rule.userId,
                orgId=rule.orgId,
                createdAt=rule.createdAt,
                updatedAt=rule.updatedAt,
            ))

        # Count enabled/disabled
        total_enabled = len([r for r in global_rules if r.enabled]) + len([r for r in custom_rules if r.enabled])
        total_disabled = len([r for r in global_rules if not r.enabled]) + len([r for r in custom_rules if not r.enabled])

        return RulesListResponse(
            globalRules=global_rules,
            customRules=custom_rules,
            totalGlobal=len(global_rules),
            totalCustom=len(custom_rules),
            totalEnabled=total_enabled,
            totalDisabled=total_disabled,
        )
    finally:
        await db.disconnect()


@router.get("/global", response_model=List[GlobalRuleResponse])
async def list_global_rules(
    category: Optional[RuleCategory] = Query(None),
    severity: Optional[RuleSeverity] = Query(None),
    clerk_id: str = Depends(require_auth)
):
    """
    List all global rules from YAML configuration with current user's override status.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id)

        # Load global rules from YAML
        rules_loader = RulesLoader()
        global_rules_raw = rules_loader.get_all_rules()

        # Get overrides
        user_overrides = await db.globalruleoverride.find_many(where={"userId": user_id})
        user_override_map = {o.globalRuleId: o for o in user_overrides}

        org_override_map = {}
        if org_id:
            org_overrides = await db.globalruleoverride.find_many(where={"orgId": org_id})
            org_override_map = {o.globalRuleId: o for o in org_overrides}

        result = []
        for rule in global_rules_raw:
            # Apply filters
            if category and rule.category != category.value:
                continue
            if severity and rule.severity != severity.value:
                continue

            override = user_override_map.get(rule.id) or org_override_map.get(rule.id)
            is_overridden = override is not None
            effective_enabled = override.enabled if override else True
            threshold_overrides = override.thresholdOverrides if override else None

            effective_condition = dict(rule.condition)
            if threshold_overrides:
                effective_condition = apply_threshold_overrides(rule.condition, threshold_overrides)

            result.append(GlobalRuleResponse(
                ruleId=rule.id,
                name=rule.name,
                category=RuleCategory(rule.category),
                severity=RuleSeverity(rule.severity),
                description=rule.description,
                condition=rule.condition,
                message=rule.message,
                remediation=rule.remediation,
                remediationOwner=rule.remediation_owner,
                automatable=rule.automatable,
                applicableStages=rule.applicable_stages or [],
                enabled=effective_enabled,
                isOverridden=is_overridden,
                thresholdOverrides=threshold_overrides,
                effectiveCondition=effective_condition if is_overridden else None,
            ))

        return result
    finally:
        await db.disconnect()


@router.get("/custom", response_model=List[CustomRuleResponse])
async def list_custom_rules(
    include_org: bool = Query(True, description="Include organization rules"),
    clerk_id: str = Depends(require_auth)
):
    """
    List user's custom rules (and optionally org rules).
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id) if include_org else None

        # Get user's custom rules
        user_rules = await db.customrule.find_many(
            where={"userId": user_id},
            order={"priority": "desc"}
        )

        # Get org rules if applicable
        org_rules = []
        if org_id:
            org_rules = await db.customrule.find_many(
                where={"orgId": org_id},
                order={"priority": "desc"}
            )

        # Combine results
        all_rules = user_rules + org_rules
        result = []
        for rule in all_rules:
            result.append(CustomRuleResponse(
                id=rule.id,
                ruleId=rule.ruleId,
                name=rule.name,
                category=RuleCategory(rule.category),
                severity=RuleSeverity(rule.severity),
                description=rule.description,
                condition=rule.condition,
                message=rule.message,
                remediation=rule.remediation,
                remediationOwner=rule.remediationOwner,
                automatable=rule.automatable,
                applicableStages=rule.applicableStages or [],
                priority=rule.priority,
                enabled=rule.enabled,
                userId=rule.userId,
                orgId=rule.orgId,
                createdAt=rule.createdAt,
                updatedAt=rule.updatedAt,
            ))

        return result
    finally:
        await db.disconnect()


# ===========================================
# CUSTOM RULES CRUD
# ===========================================

@router.post("/custom", response_model=CustomRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_rule(
    data: CustomRuleCreate,
    clerk_id: str = Depends(require_auth)
):
    """
    Create a new custom rule for the user (or their organization).
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Check paid tier
        await require_paid_tier(db, user_id)

        # Determine ownership
        target_user_id = None
        target_org_id = None

        if data.orgId:
            # Org-level rule - verify user has permission
            perms = OrgPermissions(db)
            await perms.require_manager(user_id, data.orgId)
            target_org_id = data.orgId
        else:
            # User-level rule
            target_user_id = user_id

        # Validate rule ID uniqueness
        existing = None
        if target_user_id:
            existing = await db.customrule.find_first(
                where={"userId": target_user_id, "ruleId": data.ruleId}
            )
        elif target_org_id:
            existing = await db.customrule.find_first(
                where={"orgId": target_org_id, "ruleId": data.ruleId}
            )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A rule with ID '{data.ruleId}' already exists"
            )

        # Create rule
        rule = await db.customrule.create(
            data={
                "userId": target_user_id,
                "orgId": target_org_id,
                "ruleId": data.ruleId,
                "name": data.name,
                "category": data.category.value,
                "severity": data.severity.value,
                "description": data.description,
                "condition": data.condition,
                "message": data.message,
                "remediation": data.remediation,
                "remediationOwner": data.remediationOwner.value if data.remediationOwner else None,
                "automatable": data.automatable,
                "applicableStages": data.applicableStages,
                "priority": data.priority,
                "enabled": data.enabled,
            }
        )

        return CustomRuleResponse(
            id=rule.id,
            ruleId=rule.ruleId,
            name=rule.name,
            category=RuleCategory(rule.category),
            severity=RuleSeverity(rule.severity),
            description=rule.description,
            condition=rule.condition,
            message=rule.message,
            remediation=rule.remediation,
            remediationOwner=rule.remediationOwner,
            automatable=rule.automatable,
            applicableStages=rule.applicableStages or [],
            priority=rule.priority,
            enabled=rule.enabled,
            userId=rule.userId,
            orgId=rule.orgId,
            createdAt=rule.createdAt,
            updatedAt=rule.updatedAt,
        )
    finally:
        await db.disconnect()


@router.get("/custom/{rule_id}", response_model=CustomRuleResponse)
async def get_custom_rule(
    rule_id: str,
    clerk_id: str = Depends(require_auth)
):
    """
    Get a specific custom rule by ID.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id)

        rule = await db.customrule.find_unique(where={"id": rule_id})
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        # Check ownership
        if rule.userId != user_id and rule.orgId != org_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this rule")

        return CustomRuleResponse(
            id=rule.id,
            ruleId=rule.ruleId,
            name=rule.name,
            category=RuleCategory(rule.category),
            severity=RuleSeverity(rule.severity),
            description=rule.description,
            condition=rule.condition,
            message=rule.message,
            remediation=rule.remediation,
            remediationOwner=rule.remediationOwner,
            automatable=rule.automatable,
            applicableStages=rule.applicableStages or [],
            priority=rule.priority,
            enabled=rule.enabled,
            userId=rule.userId,
            orgId=rule.orgId,
            createdAt=rule.createdAt,
            updatedAt=rule.updatedAt,
        )
    finally:
        await db.disconnect()


@router.patch("/custom/{rule_id}", response_model=CustomRuleResponse)
async def update_custom_rule(
    rule_id: str,
    data: CustomRuleUpdate,
    clerk_id: str = Depends(require_auth)
):
    """
    Update a custom rule.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id)

        # Check paid tier
        await require_paid_tier(db, user_id)

        rule = await db.customrule.find_unique(where={"id": rule_id})
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        # Check ownership
        if rule.userId and rule.userId != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this rule")
        if rule.orgId:
            perms = OrgPermissions(db)
            await perms.require_manager(user_id, rule.orgId)

        # Build update data
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.category is not None:
            update_data["category"] = data.category.value
        if data.severity is not None:
            update_data["severity"] = data.severity.value
        if data.description is not None:
            update_data["description"] = data.description
        if data.condition is not None:
            update_data["condition"] = data.condition
        if data.message is not None:
            update_data["message"] = data.message
        if data.remediation is not None:
            update_data["remediation"] = data.remediation
        if data.remediationOwner is not None:
            update_data["remediationOwner"] = data.remediationOwner.value
        if data.automatable is not None:
            update_data["automatable"] = data.automatable
        if data.applicableStages is not None:
            update_data["applicableStages"] = data.applicableStages
        if data.priority is not None:
            update_data["priority"] = data.priority
        if data.enabled is not None:
            update_data["enabled"] = data.enabled

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        updated = await db.customrule.update(
            where={"id": rule_id},
            data=update_data
        )

        return CustomRuleResponse(
            id=updated.id,
            ruleId=updated.ruleId,
            name=updated.name,
            category=RuleCategory(updated.category),
            severity=RuleSeverity(updated.severity),
            description=updated.description,
            condition=updated.condition,
            message=updated.message,
            remediation=updated.remediation,
            remediationOwner=updated.remediationOwner,
            automatable=updated.automatable,
            applicableStages=updated.applicableStages or [],
            priority=updated.priority,
            enabled=updated.enabled,
            userId=updated.userId,
            orgId=updated.orgId,
            createdAt=updated.createdAt,
            updatedAt=updated.updatedAt,
        )
    finally:
        await db.disconnect()


@router.delete("/custom/{rule_id}")
async def delete_custom_rule(
    rule_id: str,
    clerk_id: str = Depends(require_auth)
):
    """
    Delete a custom rule.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Check paid tier
        await require_paid_tier(db, user_id)

        rule = await db.customrule.find_unique(where={"id": rule_id})
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")

        # Check ownership
        if rule.userId and rule.userId != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this rule")
        if rule.orgId:
            perms = OrgPermissions(db)
            await perms.require_manager(user_id, rule.orgId)

        await db.customrule.delete(where={"id": rule_id})

        return {"success": True, "message": "Rule deleted"}
    finally:
        await db.disconnect()


# ===========================================
# GLOBAL RULE OVERRIDES
# ===========================================

@router.post("/global/{global_rule_id}/override")
async def create_global_rule_override(
    global_rule_id: str,
    data: GlobalRuleOverrideCreate,
    clerk_id: str = Depends(require_auth)
):
    """
    Create or update an override for a global rule.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Check paid tier
        await require_paid_tier(db, user_id)

        # Validate global rule exists
        rules_loader = RulesLoader()
        try:
            rules_loader.get_rule_by_id(global_rule_id)
        except ValueError:
            raise HTTPException(status_code=404, detail=f"Global rule '{global_rule_id}' not found")

        # Determine ownership
        target_user_id = None
        target_org_id = None

        if data.orgId:
            # Org-level override
            perms = OrgPermissions(db)
            await perms.require_manager(user_id, data.orgId)
            target_org_id = data.orgId
        else:
            target_user_id = user_id

        # Check for existing override
        existing = None
        if target_user_id:
            existing = await db.globalruleoverride.find_first(
                where={"userId": target_user_id, "globalRuleId": global_rule_id}
            )
        elif target_org_id:
            existing = await db.globalruleoverride.find_first(
                where={"orgId": target_org_id, "globalRuleId": global_rule_id}
            )

        if existing:
            # Update existing override
            updated = await db.globalruleoverride.update(
                where={"id": existing.id},
                data={
                    "enabled": data.enabled,
                    "thresholdOverrides": data.thresholdOverrides,
                }
            )
            return {
                "id": updated.id,
                "globalRuleId": updated.globalRuleId,
                "enabled": updated.enabled,
                "thresholdOverrides": updated.thresholdOverrides,
                "message": "Override updated"
            }
        else:
            # Create new override
            override = await db.globalruleoverride.create(
                data={
                    "userId": target_user_id,
                    "orgId": target_org_id,
                    "globalRuleId": global_rule_id,
                    "enabled": data.enabled,
                    "thresholdOverrides": data.thresholdOverrides,
                }
            )
            return {
                "id": override.id,
                "globalRuleId": override.globalRuleId,
                "enabled": override.enabled,
                "thresholdOverrides": override.thresholdOverrides,
                "message": "Override created"
            }
    finally:
        await db.disconnect()


@router.delete("/global/{global_rule_id}/override")
async def delete_global_rule_override(
    global_rule_id: str,
    org_id: Optional[str] = Query(None, description="Organization ID for org-level override"),
    clerk_id: str = Depends(require_auth)
):
    """
    Remove an override for a global rule (restore default behavior).
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Check paid tier
        await require_paid_tier(db, user_id)

        # Find the override
        if org_id:
            perms = OrgPermissions(db)
            await perms.require_manager(user_id, org_id)
            override = await db.globalruleoverride.find_first(
                where={"orgId": org_id, "globalRuleId": global_rule_id}
            )
        else:
            override = await db.globalruleoverride.find_first(
                where={"userId": user_id, "globalRuleId": global_rule_id}
            )

        if not override:
            raise HTTPException(status_code=404, detail="Override not found")

        await db.globalruleoverride.delete(where={"id": override.id})

        return {"success": True, "message": "Override removed, rule restored to default"}
    finally:
        await db.disconnect()


# ===========================================
# METADATA ENDPOINTS
# ===========================================

@router.get("/metadata", response_model=RuleMetadata)
async def get_rule_metadata(
    clerk_id: str = Depends(require_auth)
):
    """
    Get metadata for building rules (operators, fields, categories, etc.).
    """
    operators = [
        OperatorInfo(
            name="is_empty",
            description="Field is null, empty string, or whitespace only",
            requiresValue=False,
            example="deal_name is_empty"
        ),
        OperatorInfo(
            name="is_null_or_zero",
            description="Field is null or equals zero",
            requiresValue=False,
            example="amount is_null_or_zero"
        ),
        OperatorInfo(
            name="is_past",
            description="Date is before today",
            requiresValue=False,
            valueType="date",
            example="close_date is_past"
        ),
        OperatorInfo(
            name="older_than_days",
            description="Date is more than N days ago",
            requiresValue=True,
            valueType="number",
            example="last_activity_date older_than_days 30"
        ),
        OperatorInfo(
            name="within_days",
            description="Date is within the next N days",
            requiresValue=True,
            valueType="number",
            example="close_date within_days 30"
        ),
        OperatorInfo(
            name="more_than_days_away",
            description="Date is more than N days in the future",
            requiresValue=True,
            valueType="number",
            example="close_date more_than_days_away 60"
        ),
        OperatorInfo(
            name="greater_than",
            description="Numeric value is greater than N",
            requiresValue=True,
            valueType="number",
            example="amount greater_than 100000"
        ),
        OperatorInfo(
            name="less_than",
            description="Numeric value is less than N",
            requiresValue=True,
            valueType="number",
            example="probability less_than 50"
        ),
        OperatorInfo(
            name="equals",
            description="Value equals specified value",
            requiresValue=True,
            valueType="string",
            example="stage equals 'Discovery'"
        ),
        OperatorInfo(
            name="in",
            description="Value is in list of specified values",
            requiresValue=True,
            valueType="list",
            example="stage in ['Proposal', 'Negotiation']"
        ),
    ]

    fields = [
        FieldInfo(name="deal_name", displayName="Deal Name", dataType="string",
                  description="The name of the deal/opportunity",
                  commonOperators=["is_empty", "equals"]),
        FieldInfo(name="account_name", displayName="Account Name", dataType="string",
                  description="The associated company/account name",
                  commonOperators=["is_empty", "equals"]),
        FieldInfo(name="amount", displayName="Amount", dataType="currency",
                  description="Deal value in currency",
                  commonOperators=["is_null_or_zero", "greater_than", "less_than"]),
        FieldInfo(name="close_date", displayName="Close Date", dataType="date",
                  description="Expected close date",
                  commonOperators=["is_empty", "is_past", "within_days", "more_than_days_away"]),
        FieldInfo(name="stage", displayName="Stage", dataType="string",
                  description="Current pipeline stage",
                  commonOperators=["is_empty", "equals", "in"]),
        FieldInfo(name="probability", displayName="Probability", dataType="number",
                  description="Win probability percentage (0-100)",
                  commonOperators=["greater_than", "less_than"]),
        FieldInfo(name="owner_name", displayName="Owner Name", dataType="string",
                  description="Deal owner/rep name",
                  commonOperators=["is_empty", "equals"]),
        FieldInfo(name="contact_name", displayName="Contact Name", dataType="string",
                  description="Primary contact name",
                  commonOperators=["is_empty"]),
        FieldInfo(name="contact_email", displayName="Contact Email", dataType="string",
                  description="Primary contact email",
                  commonOperators=["is_empty"]),
        FieldInfo(name="contact_phone", displayName="Contact Phone", dataType="string",
                  description="Primary contact phone",
                  commonOperators=["is_empty"]),
        FieldInfo(name="last_activity_date", displayName="Last Activity Date", dataType="date",
                  description="Date of last recorded activity",
                  commonOperators=["is_empty", "older_than_days"]),
        FieldInfo(name="created_date", displayName="Created Date", dataType="date",
                  description="When the deal was created",
                  commonOperators=["older_than_days", "within_days"]),
        FieldInfo(name="next_steps", displayName="Next Steps", dataType="string",
                  description="Documented next steps",
                  commonOperators=["is_empty"]),
        FieldInfo(name="forecast_category", displayName="Forecast Category", dataType="string",
                  description="Forecast category (Pipeline, Best Case, Commit, etc.)",
                  commonOperators=["is_empty", "equals", "in"]),
        FieldInfo(name="type", displayName="Deal Type", dataType="string",
                  description="Type of deal (New Business, Renewal, Upsell, etc.)",
                  commonOperators=["is_empty", "equals", "in"]),
    ]

    stages = [
        "Prospecting", "Qualification", "Discovery", "Proposal",
        "Negotiation", "Verbal Commit", "Closed Won", "Closed Lost"
    ]

    return RuleMetadata(
        operators=operators,
        fields=fields,
        categories=[c.value for c in RuleCategory],
        severities=[s.value for s in RuleSeverity],
        stages=stages,
    )


@router.get("/summary", response_model=RulesSummary)
async def get_rules_summary(
    clerk_id: str = Depends(require_auth)
):
    """
    Get a summary of all rules by category, severity, and scope.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id
        org_id = await get_user_org_id(db, user_id)

        # Load global rules
        rules_loader = RulesLoader()
        global_rules = rules_loader.get_all_rules()

        # Get custom rules count
        user_rules_count = await db.customrule.count(where={"userId": user_id})
        org_rules_count = 0
        if org_id:
            org_rules_count = await db.customrule.count(where={"orgId": org_id})

        total_rules = len(global_rules) + user_rules_count + org_rules_count

        # Count by category
        by_category = {}
        for rule in global_rules:
            by_category[rule.category] = by_category.get(rule.category, 0) + 1

        # Count by severity
        by_severity = {}
        for rule in global_rules:
            by_severity[rule.severity] = by_severity.get(rule.severity, 0) + 1

        # Count by scope
        by_scope = {
            "global": len(global_rules),
            "user": user_rules_count,
            "org": org_rules_count,
        }

        return RulesSummary(
            totalRules=total_rules,
            byCategory=by_category,
            bySeverity=by_severity,
            byScope=by_scope,
        )
    finally:
        await db.disconnect()


# ===========================================
# HELPER FUNCTIONS
# ===========================================

def apply_threshold_overrides(condition: dict, overrides: dict) -> dict:
    """
    Apply threshold overrides to a rule condition.
    """
    result = dict(condition)

    # Handle simple condition with value override
    if "value" in overrides and "value" in result:
        result["value"] = overrides["value"]

    # Handle compound conditions
    if "all" in result and isinstance(result["all"], list):
        result["all"] = [
            apply_threshold_overrides(c, overrides) if isinstance(c, dict) else c
            for c in result["all"]
        ]

    if "any" in result and isinstance(result["any"], list):
        result["any"] = [
            apply_threshold_overrides(c, overrides) if isinstance(c, dict) else c
            for c in result["any"]
        ]

    return result
