"""
Pydantic models for CRM write operations.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import date


class DealUpdateRequest(BaseModel):
    """Request to update a deal in CRM."""
    crm_type: str  # "salesforce" | "hubspot"
    crm_deal_id: str  # The CRM's record ID

    # Fields to update (all optional - only send what changed)
    close_date: Optional[date] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    next_step: Optional[str] = None
    probability: Optional[int] = None
    description: Optional[str] = None

    # For any other fields
    custom_fields: Optional[Dict[str, Any]] = None


class DealUpdateResponse(BaseModel):
    """Response from CRM update."""
    success: bool
    crm_deal_id: str
    updated_fields: List[str]
    errors: Optional[List[Dict[str, Any]]] = None
    crm_response: Optional[Dict[str, Any]] = None


class BulkUpdateRequest(BaseModel):
    """Request to update multiple deals."""
    updates: List[DealUpdateRequest]


class BulkUpdateResponse(BaseModel):
    """Response from bulk update."""
    total: int
    successful: int
    failed: int
    results: List[DealUpdateResponse]


class DealWithIssues(BaseModel):
    """Deal with its associated issues for the review wizard."""
    id: str
    crm_id: str
    crm_type: str
    name: str
    account_name: Optional[str] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    close_date: Optional[str] = None
    next_step: Optional[str] = None
    owner_name: Optional[str] = None
    last_activity_date: Optional[str] = None
    probability: Optional[int] = None
    description: Optional[str] = None
    issues: List[Dict[str, Any]] = []


class FlaggedDealsResponse(BaseModel):
    """Response containing all flagged deals for review."""
    analysis_id: str
    total_flagged: int
    deals: List[DealWithIssues]
