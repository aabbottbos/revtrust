"""
Forecast service for managing quarterly targets and pipeline analysis
"""

from datetime import datetime, date
from typing import Optional, Tuple, List
from prisma import Prisma

from app.models.forecast import (
    QuarterlyTargetCreate,
    QuarterlyTargetResponse,
    ForecastAnalysis,
    DealSummary,
    TeamMemberForecast,
    TeamForecastRollup,
)


class ForecastService:
    """Service for forecast tracking and analysis"""

    @staticmethod
    def get_current_quarter() -> Tuple[int, int]:
        """Returns (quarter, year) for current date"""
        today = date.today()
        quarter = (today.month - 1) // 3 + 1
        return quarter, today.year

    @staticmethod
    def get_quarter_date_range(quarter: int, year: int) -> Tuple[date, date]:
        """Returns (start_date, end_date) for a quarter"""
        quarter_starts = {
            1: (1, 1),   # Jan 1
            2: (4, 1),   # Apr 1
            3: (7, 1),   # Jul 1
            4: (10, 1),  # Oct 1
        }
        quarter_ends = {
            1: (3, 31),   # Mar 31
            2: (6, 30),   # Jun 30
            3: (9, 30),   # Sep 30
            4: (12, 31),  # Dec 31
        }

        start_month, start_day = quarter_starts[quarter]
        end_month, end_day = quarter_ends[quarter]

        start_date = date(year, start_month, start_day)
        end_date = date(year, end_month, end_day)

        return start_date, end_date

    @staticmethod
    def get_days_remaining_in_quarter(quarter: int, year: int) -> int:
        """Returns days remaining in the quarter"""
        _, end_date = ForecastService.get_quarter_date_range(quarter, year)
        today = date.today()
        if today > end_date:
            return 0
        return (end_date - today).days

    async def set_target(
        self,
        db: Prisma,
        user_id: str,
        target_amount: float,
        quarter: int,
        year: int,
        set_by_user_id: str,
        org_id: Optional[str] = None,
    ) -> QuarterlyTargetResponse:
        """Create or update a quarterly target"""

        # Determine who is setting the target
        if set_by_user_id == user_id:
            set_by_role = "self"
        else:
            # Check if setter is a manager or admin
            if org_id:
                membership = await db.orgmembership.find_first(
                    where={"userId": set_by_user_id, "orgId": org_id}
                )
                if membership and membership.role == "admin":
                    set_by_role = "admin"
                elif membership and membership.role == "manager":
                    set_by_role = "manager"
                else:
                    set_by_role = "self"
            else:
                set_by_role = "self"

        # Upsert the target
        existing = await db.quarterlytarget.find_first(
            where={
                "userId": user_id,
                "orgId": org_id,
                "quarter": quarter,
                "year": year,
            }
        )

        if existing:
            target = await db.quarterlytarget.update(
                where={"id": existing.id},
                data={
                    "targetAmount": target_amount,
                    "setByUserId": set_by_user_id,
                    "setByRole": set_by_role,
                },
            )
        else:
            target = await db.quarterlytarget.create(
                data={
                    "userId": user_id,
                    "orgId": org_id,
                    "targetAmount": target_amount,
                    "quarter": quarter,
                    "year": year,
                    "setByUserId": set_by_user_id,
                    "setByRole": set_by_role,
                }
            )

        return QuarterlyTargetResponse(
            id=target.id,
            user_id=target.userId,
            org_id=target.orgId,
            target_amount=target.targetAmount,
            quarter=target.quarter,
            year=target.year,
            set_by_user_id=target.setByUserId,
            set_by_role=target.setByRole,
            created_at=target.createdAt,
            updated_at=target.updatedAt,
        )

    async def get_target(
        self,
        db: Prisma,
        user_id: str,
        quarter: int,
        year: int,
        org_id: Optional[str] = None,
    ) -> Optional[QuarterlyTargetResponse]:
        """Get a user's quarterly target"""
        target = await db.quarterlytarget.find_first(
            where={
                "userId": user_id,
                "orgId": org_id,
                "quarter": quarter,
                "year": year,
            }
        )

        if not target:
            return None

        return QuarterlyTargetResponse(
            id=target.id,
            user_id=target.userId,
            org_id=target.orgId,
            target_amount=target.targetAmount,
            quarter=target.quarter,
            year=target.year,
            set_by_user_id=target.setByUserId,
            set_by_role=target.setByRole,
            created_at=target.createdAt,
            updated_at=target.updatedAt,
        )

    async def get_team_targets(
        self,
        db: Prisma,
        org_id: str,
        quarter: int,
        year: int,
    ) -> List[QuarterlyTargetResponse]:
        """Get all targets for an organization"""
        targets = await db.quarterlytarget.find_many(
            where={
                "orgId": org_id,
                "quarter": quarter,
                "year": year,
            },
            include={"user": True},
        )

        return [
            QuarterlyTargetResponse(
                id=t.id,
                user_id=t.userId,
                org_id=t.orgId,
                target_amount=t.targetAmount,
                quarter=t.quarter,
                year=t.year,
                set_by_user_id=t.setByUserId,
                set_by_role=t.setByRole,
                created_at=t.createdAt,
                updated_at=t.updatedAt,
            )
            for t in targets
        ]

    def analyze_pipeline(
        self,
        deals: List[dict],
        target: Optional[QuarterlyTargetResponse],
        quarter: int,
        year: int,
    ) -> ForecastAnalysis:
        """Analyze pipeline against target for forecast"""
        start_date, end_date = self.get_quarter_date_range(quarter, year)
        days_remaining = self.get_days_remaining_in_quarter(quarter, year)
        today = date.today()

        # Filter deals to current quarter based on close date
        quarter_deals = []
        for deal in deals:
            close_date_str = deal.get("close_date")
            if not close_date_str:
                continue

            try:
                # Handle various date formats
                if isinstance(close_date_str, str):
                    if "T" in close_date_str:
                        close_date = datetime.fromisoformat(close_date_str.replace("Z", "+00:00")).date()
                    else:
                        close_date = datetime.strptime(close_date_str[:10], "%Y-%m-%d").date()
                elif isinstance(close_date_str, datetime):
                    close_date = close_date_str.date()
                elif isinstance(close_date_str, date):
                    close_date = close_date_str
                else:
                    continue

                if start_date <= close_date <= end_date:
                    days_until = (close_date - today).days
                    quarter_deals.append({
                        **deal,
                        "days_until_close": days_until,
                        "parsed_close_date": close_date,
                    })
            except (ValueError, TypeError):
                continue

        # Calculate metrics
        current_pipeline = sum(d.get("amount", 0) or 0 for d in quarter_deals)
        weighted_pipeline = sum(
            (d.get("amount", 0) or 0) * (d.get("probability", 50) or 50) / 100
            for d in quarter_deals
        )

        target_amount = target.target_amount if target else 0
        gap = target_amount - current_pipeline
        gap_percentage = (gap / target_amount * 100) if target_amount > 0 else 0
        coverage_ratio = (current_pipeline / target_amount) if target_amount > 0 else 0
        weighted_coverage = (weighted_pipeline / target_amount) if target_amount > 0 else 0

        # Build deal summaries
        deal_summaries = [
            DealSummary(
                id=d.get("id", ""),
                name=d.get("name", "Unknown"),
                amount=d.get("amount", 0) or 0,
                close_date=str(d.get("close_date", ""))[:10] if d.get("close_date") else None,
                stage=d.get("stage"),
                probability=d.get("probability"),
                owner=d.get("owner"),
                account=d.get("account"),
                days_until_close=d.get("days_until_close"),
                last_activity_date=str(d.get("last_activity_date", ""))[:10] if d.get("last_activity_date") else None,
            )
            for d in sorted(quarter_deals, key=lambda x: x.get("amount", 0) or 0, reverse=True)
        ]

        return ForecastAnalysis(
            target=target,
            target_amount=target_amount,
            current_pipeline=current_pipeline,
            weighted_pipeline=weighted_pipeline,
            gap=gap,
            gap_percentage=gap_percentage,
            deal_count=len(quarter_deals),
            deals=deal_summaries,
            coverage_ratio=coverage_ratio,
            weighted_coverage=weighted_coverage,
            quarter=quarter,
            year=year,
            quarter_start=str(start_date),
            quarter_end=str(end_date),
            days_remaining=days_remaining,
        )

    async def get_team_forecast_rollup(
        self,
        db: Prisma,
        org_id: str,
        quarter: int,
        year: int,
        member_analyses: List[Tuple[str, ForecastAnalysis]],
    ) -> TeamForecastRollup:
        """Build team-level forecast rollup"""
        org = await db.organization.find_unique(where={"id": org_id})
        if not org:
            raise ValueError(f"Organization {org_id} not found")

        members = await db.orgmembership.find_many(
            where={"orgId": org_id, "isActive": True},
            include={"user": True},
        )

        member_forecasts = []
        total_target = 0
        total_pipeline = 0
        total_weighted = 0
        on_track = 0
        at_risk = 0
        without_targets = 0

        # Build analysis lookup
        analysis_by_user = {user_id: analysis for user_id, analysis in member_analyses}

        for member in members:
            user = member.user
            if not user:
                continue

            analysis = analysis_by_user.get(user.id)

            if analysis and analysis.target:
                target_amount = analysis.target_amount
                pipeline = analysis.current_pipeline
                weighted = analysis.weighted_pipeline
                gap = analysis.gap
                gap_pct = analysis.gap_percentage
                coverage = analysis.coverage_ratio
                deal_count = analysis.deal_count
                set_by_role = analysis.target.set_by_role

                # Determine confidence
                if coverage >= 1.0:
                    confidence = "on_track"
                    on_track += 1
                elif coverage >= 0.8:
                    confidence = "achievable"
                    on_track += 1
                elif coverage >= 0.5:
                    confidence = "needs_work"
                    at_risk += 1
                else:
                    confidence = "at_risk"
                    at_risk += 1

                total_target += target_amount
                total_pipeline += pipeline
                total_weighted += weighted
            else:
                target_amount = 0
                pipeline = analysis.current_pipeline if analysis else 0
                weighted = analysis.weighted_pipeline if analysis else 0
                gap = 0
                gap_pct = 0
                coverage = 0
                deal_count = analysis.deal_count if analysis else 0
                confidence = "no_target"
                set_by_role = "none"
                without_targets += 1
                total_pipeline += pipeline
                total_weighted += weighted

            member_forecasts.append(TeamMemberForecast(
                user_id=user.id,
                name=f"{user.firstName or ''} {user.lastName or ''}".strip() or None,
                email=user.email,
                target_amount=target_amount,
                current_pipeline=pipeline,
                weighted_pipeline=weighted,
                gap=gap,
                gap_percentage=gap_pct,
                coverage_ratio=coverage,
                deal_count=deal_count,
                forecast_confidence=confidence,
                set_by_role=set_by_role,
            ))

        total_gap = total_target - total_pipeline
        team_coverage = (total_pipeline / total_target) if total_target > 0 else 0
        team_weighted_coverage = (total_weighted / total_target) if total_target > 0 else 0

        return TeamForecastRollup(
            org_id=org_id,
            org_name=org.name,
            quarter=quarter,
            year=year,
            total_target=total_target,
            total_pipeline=total_pipeline,
            total_weighted_pipeline=total_weighted,
            total_gap=total_gap,
            team_coverage=team_coverage,
            team_weighted_coverage=team_weighted_coverage,
            members=member_forecasts,
            members_on_track=on_track,
            members_at_risk=at_risk,
            members_without_targets=without_targets,
        )


# Singleton instance
forecast_service = ForecastService()
