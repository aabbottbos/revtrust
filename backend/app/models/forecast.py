"""
Pydantic models for forecast tracking feature
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ===========================================
# REQUEST MODELS
# ===========================================

class QuarterlyTargetCreate(BaseModel):
    """Create or update a quarterly target"""
    target_amount: float = Field(..., gt=0, description="Target amount in dollars")
    quarter: int = Field(..., ge=1, le=4, description="Quarter (1-4)")
    year: int = Field(..., ge=2020, le=2100, description="Year")
    user_id: Optional[str] = Field(None, description="For managers setting others' targets")
    org_id: Optional[str] = Field(None, description="Organization ID")


class ForecastCoachingRequest(BaseModel):
    """Request for AI coaching on forecast"""
    org_id: Optional[str] = None
    quarter: Optional[int] = None  # Defaults to current quarter
    year: Optional[int] = None


# ===========================================
# RESPONSE MODELS
# ===========================================

class QuarterlyTargetResponse(BaseModel):
    """Response for quarterly target"""
    id: str
    user_id: str
    org_id: Optional[str]
    target_amount: float
    quarter: int
    year: int
    set_by_user_id: str
    set_by_role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DealSummary(BaseModel):
    """Summary of a deal for forecast analysis"""
    id: str
    name: str
    amount: float
    close_date: Optional[str]
    stage: Optional[str]
    probability: Optional[float]
    owner: Optional[str]
    account: Optional[str]
    days_until_close: Optional[int]
    last_activity_date: Optional[str]


class ForecastAnalysis(BaseModel):
    """Analysis of pipeline vs target"""
    target: Optional[QuarterlyTargetResponse]
    target_amount: float
    current_pipeline: float
    weighted_pipeline: float  # Probability-weighted
    gap: float  # target - pipeline (positive = need more)
    gap_percentage: float
    deal_count: int
    deals: List[DealSummary]
    coverage_ratio: float  # pipeline / target (e.g., 1.2x)
    weighted_coverage: float  # weighted_pipeline / target
    quarter: int
    year: int
    quarter_start: str
    quarter_end: str
    days_remaining: int


class DealRecommendation(BaseModel):
    """AI recommendation for a specific deal"""
    deal_id: str
    deal_name: str
    deal_amount: float
    current_stage: Optional[str]
    assessment: str  # Direct assessment of deal health
    action: str  # Specific action to take
    priority: str  # "critical" | "high" | "medium" | "low"
    probability_of_close: str  # AI's assessment
    risk_factors: List[str]


class ForecastCoaching(BaseModel):
    """AI coaching response for forecast"""
    # Summary
    verdict: str  # Blunt assessment: will they hit or miss?
    forecast_confidence: str  # "at_risk" | "needs_work" | "achievable" | "on_track" | "exceeding"

    # Gap strategy
    gap_strategy: str  # How to close the gap

    # Deal-level recommendations
    deal_recommendations: List[DealRecommendation]

    # Priority actions
    this_week_actions: List[str]  # Top 3-5 things to do this week

    # Hard truths
    hard_truth: str  # What they're probably avoiding

    # Metrics
    total_deals_analyzed: int
    high_priority_count: int

    # Analysis metadata
    generated_at: datetime


class TeamMemberForecast(BaseModel):
    """Forecast data for a single team member"""
    user_id: str
    name: Optional[str]
    email: str
    target_amount: float
    current_pipeline: float
    weighted_pipeline: float
    gap: float
    gap_percentage: float
    coverage_ratio: float
    deal_count: int
    forecast_confidence: str  # "at_risk" | "needs_work" | "achievable" | "on_track"
    set_by_role: str  # Who set the target


class TeamForecastRollup(BaseModel):
    """Team-level forecast rollup for managers"""
    org_id: str
    org_name: str
    quarter: int
    year: int

    # Team totals
    total_target: float
    total_pipeline: float
    total_weighted_pipeline: float
    total_gap: float
    team_coverage: float
    team_weighted_coverage: float

    # Member breakdown
    members: List[TeamMemberForecast]

    # Summary stats
    members_on_track: int
    members_at_risk: int
    members_without_targets: int
