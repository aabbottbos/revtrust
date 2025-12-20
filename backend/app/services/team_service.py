"""
Business logic for team dashboard and analytics.
"""

from typing import List
from prisma import Prisma

from app.models.organization import TeamHealthSummary, TeamMemberSummary


class TeamService:
    """
    Service for team-level analytics and dashboard data.
    """

    def __init__(self, db: Prisma):
        self.db = db

    async def get_team_health_summary(
        self,
        org_id: str,
        user_ids: List[str]
    ) -> TeamHealthSummary:
        """
        Calculate aggregate health metrics for a set of users.
        """
        if not user_ids:
            return TeamHealthSummary(
                totalMembers=0,
                activeMembers=0,
                totalDeals=0,
                totalPipelineValue=0.0,
                averageHealthScore=0.0,
                totalCriticalIssues=0,
                totalMajorIssues=0,
                totalMinorIssues=0,
            )

        # Get latest analysis for each user
        analyses = []
        for user_id in user_ids:
            analysis = await self.db.analysis.find_first(
                where={"userId": user_id, "processingStatus": "COMPLETED"},
                order={"createdAt": "desc"}
            )
            if analysis:
                analyses.append(analysis)

        if not analyses:
            return TeamHealthSummary(
                totalMembers=len(user_ids),
                activeMembers=0,
                totalDeals=0,
                totalPipelineValue=0.0,
                averageHealthScore=0.0,
                totalCriticalIssues=0,
                totalMajorIssues=0,
                totalMinorIssues=0,
            )

        # Aggregate metrics
        total_deals = sum(a.totalDeals or 0 for a in analyses)
        total_value = sum(float(a.totalAmount or 0) for a in analyses)
        avg_health = sum(float(a.healthScore or 0) for a in analyses) / len(analyses)
        total_critical = sum(a.totalCritical or 0 for a in analyses)
        total_warnings = sum(a.totalWarnings or 0 for a in analyses)

        return TeamHealthSummary(
            totalMembers=len(user_ids),
            activeMembers=len(analyses),
            totalDeals=total_deals,
            totalPipelineValue=total_value,
            averageHealthScore=round(avg_health, 1),
            totalCriticalIssues=total_critical,
            totalMajorIssues=total_warnings,
            totalMinorIssues=0,  # Not tracked in current Analysis model
        )

    async def get_member_summaries(
        self,
        org_id: str,
        user_ids: List[str]
    ) -> List[TeamMemberSummary]:
        """
        Get summary stats for each team member.
        """
        members = []

        for user_id in user_ids:
            membership = await self.db.orgmembership.find_first(
                where={"orgId": org_id, "userId": user_id},
                include={"user": True}
            )
            if not membership:
                continue

            # Get latest analysis
            analysis = await self.db.analysis.find_first(
                where={"userId": user_id, "processingStatus": "COMPLETED"},
                order={"createdAt": "desc"}
            )

            # Calculate trend (compare to previous analysis)
            trend = None
            if analysis:
                prev_analysis = await self.db.analysis.find_first(
                    where={
                        "userId": user_id,
                        "processingStatus": "COMPLETED",
                        "createdAt": {"lt": analysis.createdAt}
                    },
                    order={"createdAt": "desc"}
                )
                if prev_analysis:
                    diff = float(analysis.healthScore or 0) - float(prev_analysis.healthScore or 0)
                    if diff > 2:
                        trend = "up"
                    elif diff < -2:
                        trend = "down"
                    else:
                        trend = "stable"

            # Build display name
            display_name = None
            if membership.user:
                if membership.user.firstName and membership.user.lastName:
                    display_name = f"{membership.user.firstName} {membership.user.lastName}"
                elif membership.user.firstName:
                    display_name = membership.user.firstName

            members.append(TeamMemberSummary(
                userId=membership.userId,
                name=display_name,
                email=membership.user.email if membership.user else "",
                role=membership.role,
                healthScore=float(analysis.healthScore) if analysis else 0.0,
                totalDeals=analysis.totalDeals if analysis else 0,
                totalValue=float(analysis.totalAmount) if analysis and analysis.totalAmount else 0.0,
                criticalIssues=analysis.totalCritical if analysis else 0,
                majorIssues=analysis.totalWarnings if analysis else 0,
                healthScoreTrend=trend,
            ))

        # Sort by health score (lowest first - they need attention)
        members.sort(key=lambda m: m.healthScore)

        return members

    async def get_pipeline_by_stage(
        self,
        org_id: str,
        user_ids: List[str]
    ) -> dict:
        """
        Aggregate pipeline value by stage across team.
        """
        pipeline = {}

        for user_id in user_ids:
            # Get the latest completed analysis for this user
            analysis = await self.db.analysis.find_first(
                where={"userId": user_id, "processingStatus": "COMPLETED"},
                order={"createdAt": "desc"}
            )
            if not analysis:
                continue

            # Get deals from this analysis
            deals = await self.db.deal.find_many(
                where={"analysisId": analysis.id}
            )

            for deal in deals:
                stage = deal.stage or "Unknown"
                amount = float(deal.amount or 0)
                if stage not in pipeline:
                    pipeline[stage] = 0.0
                pipeline[stage] += amount

        return pipeline

    async def get_top_issues(
        self,
        org_id: str,
        user_ids: List[str],
        limit: int = 5
    ) -> List[dict]:
        """
        Get most common issues across the team.
        """
        issue_counts = {}

        for user_id in user_ids:
            # Get the latest completed analysis for this user
            analysis = await self.db.analysis.find_first(
                where={"userId": user_id, "processingStatus": "COMPLETED"},
                order={"createdAt": "desc"}
            )
            if not analysis:
                continue

            # Get violations from deals in this analysis
            violations = await self.db.violation.find_many(
                where={
                    "deal": {
                        "analysisId": analysis.id
                    }
                }
            )

            for violation in violations:
                rule_name = violation.ruleName or "Unknown"
                if rule_name not in issue_counts:
                    issue_counts[rule_name] = 0
                issue_counts[rule_name] += 1

        # Sort by count and return top N
        sorted_issues = sorted(
            issue_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]

        return [
            {"type": issue_type, "count": count}
            for issue_type, count in sorted_issues
        ]
