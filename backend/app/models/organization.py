"""
Pydantic models for organization/team management.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


# ===========================================
# ENUMS
# ===========================================

class OrgRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AE = "ae"


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


# ===========================================
# ORGANIZATION MODELS
# ===========================================

class OrganizationCreate(BaseModel):
    """Request model for creating an organization."""
    name: str = Field(..., min_length=2, max_length=100)


class OrganizationUpdate(BaseModel):
    """Request model for updating an organization."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    settings: Optional[dict] = None


class OrganizationResponse(BaseModel):
    """Response model for organization data."""
    id: str
    name: str
    slug: str
    planTier: str
    memberCount: int = 0
    createdAt: datetime

    class Config:
        from_attributes = True


class OrganizationDetailResponse(OrganizationResponse):
    """Detailed organization response with settings."""
    settings: dict = {}
    stripeCustomerId: Optional[str] = None


# ===========================================
# MEMBERSHIP MODELS
# ===========================================

class MembershipCreate(BaseModel):
    """Request model for adding a member directly (admin only)."""
    userId: str
    role: OrgRole = OrgRole.AE
    reportsTo: Optional[str] = None


class MembershipUpdate(BaseModel):
    """Request model for updating a membership."""
    role: Optional[OrgRole] = None
    reportsTo: Optional[str] = None
    isActive: Optional[bool] = None


class MemberResponse(BaseModel):
    """Response model for a team member."""
    id: str
    userId: str
    email: str
    name: Optional[str]
    role: str
    reportsTo: Optional[str]
    isActive: bool
    joinedAt: datetime

    # Pipeline stats (optional, for dashboard)
    pipelineHealth: Optional[float] = None
    totalDeals: Optional[int] = None
    totalValue: Optional[float] = None
    criticalIssues: Optional[int] = None

    class Config:
        from_attributes = True


# ===========================================
# INVITATION MODELS
# ===========================================

class InvitationCreate(BaseModel):
    """Request model for sending an invitation."""
    email: EmailStr
    role: OrgRole = OrgRole.AE
    reportsTo: Optional[str] = None


class InvitationResponse(BaseModel):
    """Response model for an invitation."""
    id: str
    email: str
    role: str
    status: str
    invitedBy: str
    inviterName: Optional[str]
    createdAt: datetime
    expiresAt: datetime

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    """Request model for accepting an invitation."""
    token: str


# ===========================================
# TEAM DASHBOARD MODELS
# ===========================================

class TeamHealthSummary(BaseModel):
    """Aggregate team health metrics."""
    totalMembers: int
    activeMembers: int

    # Pipeline aggregates
    totalDeals: int
    totalPipelineValue: float
    averageHealthScore: float

    # Issue breakdown
    totalCriticalIssues: int
    totalMajorIssues: int
    totalMinorIssues: int

    # Comparison (vs last period)
    healthScoreChange: Optional[float] = None
    valueChange: Optional[float] = None


class TeamMemberSummary(BaseModel):
    """Summary of a team member for dashboard."""
    userId: str
    name: Optional[str]
    email: str
    role: str

    # Their pipeline stats
    healthScore: float
    totalDeals: int
    totalValue: float
    criticalIssues: int
    majorIssues: int

    # Trend
    healthScoreTrend: Optional[str] = None  # "up", "down", "stable"

    class Config:
        from_attributes = True


class TeamDashboardResponse(BaseModel):
    """Full team dashboard data."""
    organization: OrganizationResponse
    summary: TeamHealthSummary
    members: List[TeamMemberSummary]

    # Pipeline by stage (aggregate)
    pipelineByStage: dict  # {"Discovery": 500000, "Proposal": 300000, ...}

    # Top issues across team
    topIssues: List[dict]  # [{type: "stale_deal", count: 15}, ...]
