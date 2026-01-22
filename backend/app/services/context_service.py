"""
User Context Service
Aggregates user profile, performance targets, and historical data for AI analysis
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from prisma import Prisma
import logging

logger = logging.getLogger(__name__)


class UserSalesContext:
    """Container for user sales context data"""
    def __init__(self, data: Dict[str, Any]):
        # Profile
        self.role = data.get('role')
        self.selling_motion = data.get('selling_motion')
        self.years_in_sales = data.get('years_in_sales')
        self.sales_methodology = data.get('sales_methodology')
        self.typical_sales_cycle = data.get('typical_sales_cycle')
        self.typical_deal_size = data.get('typical_deal_size')

        # Territory
        self.territory = data.get('territory')
        self.industry = data.get('industry')
        self.market_maturity = data.get('market_maturity')
        self.competition = data.get('competition')

        # Preferences
        self.coaching_style = data.get('coaching_style')
        self.notification_frequency = data.get('notification_frequency')
        self.risk_tolerance = data.get('risk_tolerance')
        self.communication_tone = data.get('communication_tone')

        # Performance
        self.current_quarter_target = data.get('current_quarter_target')
        self.current_pipeline_value = data.get('current_pipeline_value')
        self.gap_to_target = data.get('gap_to_target')

        # Historical benchmarks
        self.calculated_avg_cycle = data.get('calculated_avg_cycle')
        self.calculated_avg_deal_size = data.get('calculated_avg_deal_size')
        self.deal_count = data.get('deal_count', 0)

        # Products
        self.products = data.get('products', [])

    def has_profile(self) -> bool:
        """Check if user has any profile data"""
        return any([self.role, self.selling_motion, self.years_in_sales,
                   self.sales_methodology, self.typical_sales_cycle, self.typical_deal_size])

    def has_quota(self) -> bool:
        """Check if user has quota data"""
        return self.current_quarter_target is not None

    def has_methodology(self) -> bool:
        """Check if user has set a sales methodology"""
        return self.sales_methodology is not None and self.sales_methodology != 'none'

    def has_territory(self) -> bool:
        """Check if user has territory data"""
        return any([self.territory, self.industry, self.market_maturity])

    def get_typical_cycle_days(self) -> Optional[int]:
        """Get typical sales cycle in days (prefer calculated, fallback to user-entered)"""
        if self.calculated_avg_cycle is not None and self.deal_count >= 5:
            return int(self.calculated_avg_cycle)

        if self.typical_sales_cycle:
            # Parse range like "30-60" to midpoint
            cycle_map = {
                "<30": 20,
                "30-60": 45,
                "60-90": 75,
                "90-180": 135,
                "180+": 270
            }
            return cycle_map.get(self.typical_sales_cycle)

        return None

    def get_typical_deal_size(self) -> Optional[float]:
        """Get typical deal size (prefer calculated, fallback to user-entered)"""
        if self.calculated_avg_deal_size is not None and self.deal_count >= 5:
            return self.calculated_avg_deal_size

        if self.typical_deal_size:
            # Parse range like "10k-50k" to midpoint
            size_map = {
                "<10k": 5000,
                "10k-50k": 30000,
                "50k-100k": 75000,
                "100k-500k": 300000,
                "500k+": 750000
            }
            return size_map.get(self.typical_deal_size)

        return None


async def get_user_sales_context(user_id: str, prisma: Prisma) -> UserSalesContext:
    """
    Fetch and aggregate all user context for AI analysis

    Args:
        user_id: Clerk user ID
        prisma: Connected Prisma client

    Returns:
        UserSalesContext object with all available context
    """
    try:
        # Fetch user profile
        user = await prisma.user.find_unique(
            where={"clerkId": user_id},
            include={
                "revenueTargets": True,
                "products": True
            }
        )

        if not user:
            logger.warning(f"User {user_id} not found, returning empty context")
            return UserSalesContext({})

        # Get current quarter
        now = datetime.now()
        current_year = now.year
        current_quarter = (now.month - 1) // 3 + 1

        # Find current quarter target
        current_target = None
        for target in user.revenueTargets:
            if target.year == current_year and target.quarter == current_quarter:
                current_target = target
                break

        # Calculate historical benchmarks from past analyses
        historical_data = await calculate_historical_benchmarks(user.id, prisma)

        # Calculate current pipeline value and gap (we'll need to aggregate from recent deals)
        pipeline_value = historical_data.get('recent_pipeline_value', 0)
        gap_to_target = None
        if current_target:
            gap_to_target = max(0, current_target.target - pipeline_value)

        # Build context data
        context_data = {
            # Profile
            'role': user.role,
            'selling_motion': user.sellingMotion,
            'years_in_sales': user.yearsInSales,
            'sales_methodology': user.salesMethodology,
            'typical_sales_cycle': user.typicalSalesCycle,
            'typical_deal_size': user.typicalDealSize,

            # Territory
            'territory': user.territory,
            'industry': user.industry,
            'market_maturity': user.marketMaturity,
            'competition': user.competition,

            # Preferences
            'coaching_style': user.coachingStyle,
            'notification_frequency': user.notificationFrequency,
            'risk_tolerance': user.riskTolerance,
            'communication_tone': user.communicationTone,

            # Performance
            'current_quarter_target': current_target.target if current_target else None,
            'current_pipeline_value': pipeline_value,
            'gap_to_target': gap_to_target,

            # Historical benchmarks
            'calculated_avg_cycle': historical_data.get('avg_cycle_days'),
            'calculated_avg_deal_size': historical_data.get('avg_deal_size'),
            'deal_count': historical_data.get('deal_count', 0),

            # Products
            'products': [{'name': p.name, 'typical_cycle': p.typicalCycle, 'price_range': p.priceRange}
                        for p in user.products]
        }

        return UserSalesContext(context_data)

    except Exception as e:
        logger.error(f"Error fetching user context for {user_id}: {e}", exc_info=True)
        return UserSalesContext({})


async def calculate_historical_benchmarks(db_user_id: str, prisma: Prisma) -> Dict[str, Any]:
    """
    Calculate historical benchmarks from user's past deal analyses

    Args:
        db_user_id: Database user ID (not Clerk ID)
        prisma: Connected Prisma client

    Returns:
        Dictionary with avg_cycle_days, avg_deal_size, deal_count, recent_pipeline_value
    """
    try:
        # Get user's analyses from last 90 days
        ninety_days_ago = datetime.now() - timedelta(days=90)

        analyses = await prisma.analysis.find_many(
            where={
                "userId": db_user_id,
                "processingStatus": "COMPLETED",
                "completedAt": {"gte": ninety_days_ago}
            },
            include={
                "deals": True
            },
            order_by={"completedAt": "desc"},
            take=10  # Last 10 analyses
        )

        if not analyses:
            return {'deal_count': 0}

        # Aggregate deal data
        all_deals = []
        for analysis in analyses:
            all_deals.extend(analysis.deals)

        if not all_deals:
            return {'deal_count': 0}

        # Calculate average deal size
        deal_amounts = [d.amount for d in all_deals if d.amount and d.amount > 0]
        avg_deal_size = sum(deal_amounts) / len(deal_amounts) if deal_amounts else None

        # Calculate average cycle (createdDate to closeDate or current date)
        cycle_days = []
        for deal in all_deals:
            if deal.createdDate:
                if deal.actualCloseDate:
                    days = (deal.actualCloseDate - deal.createdDate).days
                elif deal.closeDate:
                    days = (deal.closeDate - deal.createdDate).days
                else:
                    days = (datetime.now() - deal.createdDate).days

                if 0 < days < 730:  # Sanity check: between 0 and 2 years
                    cycle_days.append(days)

        avg_cycle = sum(cycle_days) / len(cycle_days) if cycle_days else None

        # Calculate recent pipeline value (most recent analysis)
        recent_pipeline_value = 0
        if analyses:
            most_recent = analyses[0]
            recent_pipeline_value = sum(d.amount for d in most_recent.deals if d.amount) or 0

        return {
            'avg_cycle_days': avg_cycle,
            'avg_deal_size': avg_deal_size,
            'deal_count': len(all_deals),
            'recent_pipeline_value': recent_pipeline_value
        }

    except Exception as e:
        logger.error(f"Error calculating historical benchmarks: {e}", exc_info=True)
        return {'deal_count': 0}


def calculate_deal_priority(
    deal: Dict[str, Any],
    user_context: UserSalesContext
) -> Dict[str, Any]:
    """
    Calculate deal priority score based on quota urgency and deal characteristics

    Args:
        deal: Deal data dictionary
        user_context: User context object

    Returns:
        Dictionary with priority_score (0-100), priority_level, quota_impact_pct, velocity_ratio
    """
    priority_score = 50  # Default medium priority
    components = {}

    try:
        deal_value = deal.get('amount', 0) or 0

        # Component 1: Quota Impact (40 points)
        quota_impact_pct = 0
        if user_context.has_quota() and user_context.gap_to_target and user_context.gap_to_target > 0:
            quota_impact_pct = (deal_value / user_context.gap_to_target) * 100
            # Cap at 100% for scoring purposes
            quota_component = min(40, (quota_impact_pct / 100) * 40)
            components['quota_impact'] = quota_component
        else:
            # No quota data, use deal size relative to typical
            typical_size = user_context.get_typical_deal_size()
            if typical_size:
                size_ratio = deal_value / typical_size
                components['quota_impact'] = min(40, size_ratio * 20)

        # Component 2: Velocity Urgency (30 points)
        velocity_ratio = 1.0
        days_in_stage = 0
        if deal.get('createdDate'):
            created = deal['createdDate']
            if isinstance(created, str):
                from dateutil import parser
                created = parser.parse(created)
            days_in_stage = (datetime.now() - created).days

            typical_cycle = user_context.get_typical_cycle_days()
            if typical_cycle and typical_cycle > 0:
                velocity_ratio = days_in_stage / typical_cycle
                # Higher ratio = slower deal = more urgent
                velocity_component = min(30, (velocity_ratio - 0.5) * 30)
                components['velocity'] = max(0, velocity_component)

        # Component 3: Process Risk (20 points)
        # This will be enhanced when we implement methodology checklist
        # For now, use stage and data completeness
        if deal.get('hasIssues'):
            components['process_risk'] = 20
        elif deal.get('criticalCount', 0) > 0:
            components['process_risk'] = 15
        elif deal.get('warningCount', 0) > 0:
            components['process_risk'] = 10
        else:
            components['process_risk'] = 0

        # Component 4: Timing Urgency (10 points)
        if deal.get('closeDate'):
            close_date = deal['closeDate']
            if isinstance(close_date, str):
                from dateutil import parser
                close_date = parser.parse(close_date)

            days_to_close = (close_date - datetime.now()).days
            if days_to_close < 0:
                # Overdue
                components['timing'] = 10
            elif days_to_close < 7:
                # Within a week
                components['timing'] = 8
            elif days_to_close < 30:
                # Within a month
                components['timing'] = 5
            else:
                components['timing'] = 2

        # Calculate total priority score
        priority_score = sum(components.values())
        priority_score = max(0, min(100, priority_score))  # Clamp 0-100

        # Determine priority level
        if priority_score >= 75:
            priority_level = "critical"
        elif priority_score >= 50:
            priority_level = "high"
        elif priority_score >= 25:
            priority_level = "medium"
        else:
            priority_level = "low"

        return {
            'priority_score': round(priority_score, 1),
            'priority_level': priority_level,
            'quota_impact_pct': round(quota_impact_pct, 1) if quota_impact_pct else None,
            'velocity_ratio': round(velocity_ratio, 2),
            'components': components
        }

    except Exception as e:
        logger.error(f"Error calculating deal priority: {e}", exc_info=True)
        return {
            'priority_score': 50,
            'priority_level': 'medium',
            'quota_impact_pct': None,
            'velocity_ratio': 1.0,
            'components': {}
        }


def get_methodology_checklist(methodology: str, deal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get methodology checklist and attempt to infer completion from deal data

    Args:
        methodology: Sales methodology (meddic, bant, etc.)
        deal: Deal data dictionary

    Returns:
        Dictionary with checklist items and completion status
    """
    checklists = {
        'meddic': [
            {'name': 'Metrics', 'key': 'metrics', 'description': 'Quantifiable business outcomes'},
            {'name': 'Economic Buyer', 'key': 'economic_buyer', 'description': 'Person with budget authority'},
            {'name': 'Decision Criteria', 'key': 'decision_criteria', 'description': 'How they will evaluate options'},
            {'name': 'Decision Process', 'key': 'decision_process', 'description': 'Steps to final decision'},
            {'name': 'Identify Pain', 'key': 'pain', 'description': 'Business problem being solved'},
            {'name': 'Champion', 'key': 'champion', 'description': 'Internal advocate selling for you'}
        ],
        'bant': [
            {'name': 'Budget', 'key': 'budget', 'description': 'Funds allocated'},
            {'name': 'Authority', 'key': 'authority', 'description': 'Decision maker identified'},
            {'name': 'Need', 'key': 'need', 'description': 'Clear business need'},
            {'name': 'Timeline', 'key': 'timeline', 'description': 'Buying timeline established'}
        ],
        'sandler': [
            {'name': 'Pain', 'key': 'pain', 'description': 'Emotional and technical pain identified'},
            {'name': 'Budget', 'key': 'budget', 'description': 'Financial capability confirmed'},
            {'name': 'Decision', 'key': 'decision', 'description': 'Decision process understood'},
            {'name': 'Relationship', 'key': 'relationship', 'description': 'Trust established'}
        ],
        'solution_selling': [
            {'name': 'Situation', 'key': 'situation', 'description': 'Current state understood'},
            {'name': 'Problem', 'key': 'problem', 'description': 'Problem identified'},
            {'name': 'Implication', 'key': 'implication', 'description': 'Impact of problem'},
            {'name': 'Need-Payoff', 'key': 'need_payoff', 'description': 'Value of solution'}
        ],
        'challenger': [
            {'name': 'Warmer', 'key': 'warmer', 'description': 'Build credibility'},
            {'name': 'Reframe', 'key': 'reframe', 'description': 'Challenge thinking'},
            {'name': 'Rational Drowning', 'key': 'rational_drowning', 'description': 'Emotional impact'},
            {'name': 'Solution', 'key': 'solution', 'description': 'Your unique solution'},
            {'name': 'Action', 'key': 'action', 'description': 'Next steps'}
        ]
    }

    methodology = methodology.lower() if methodology else ''
    checklist = checklists.get(methodology, [])

    if not checklist:
        return {
            'methodology': methodology,
            'items': [],
            'completed': 0,
            'total': 0,
            'completion_pct': 0
        }

    # Simple heuristic inference based on available data
    # In a real implementation, this would use AI or explicit field mapping
    completed_count = 0

    for item in checklist:
        item['status'] = 'unknown'  # 'complete', 'incomplete', 'unknown'

        # Basic inference (very naive - AI will do better in prompt)
        if item['key'] in ['budget', 'metrics'] and deal.get('amount') and deal.get('amount') > 0:
            item['status'] = 'complete'
            completed_count += 1
        elif item['key'] in ['authority', 'economic_buyer', 'decision'] and deal.get('contactName'):
            item['status'] = 'complete'
            completed_count += 1
        elif item['key'] in ['timeline', 'action'] and deal.get('closeDate'):
            item['status'] = 'complete'
            completed_count += 1
        elif item['key'] in ['pain', 'need', 'problem'] and deal.get('description'):
            item['status'] = 'complete'
            completed_count += 1

    return {
        'methodology': methodology,
        'items': checklist,
        'completed': completed_count,
        'total': len(checklist),
        'completion_pct': round((completed_count / len(checklist)) * 100) if checklist else 0
    }
