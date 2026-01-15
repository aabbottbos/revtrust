"""
Win/Loss Pattern Detection Service
Analyzes closed deals to identify patterns in wins and losses
"""

import os
import json
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import anthropic
from prisma.models import Deal


@dataclass
class WinPattern:
    """Pattern identified in won deals"""
    pattern_type: str  # "engagement", "timeline", "stakeholder", "process"
    description: str
    frequency: float  # Percentage of wins showing this pattern
    example: str
    impact_score: float  # 0-100, how strong the correlation


@dataclass
class LossPattern:
    """Pattern identified in lost deals"""
    pattern_type: str  # "engagement", "timeline", "stakeholder", "process"
    description: str
    frequency: float  # Percentage of losses showing this pattern
    example: str
    impact_score: float  # 0-100, how strong the correlation


@dataclass
class WinLossMetrics:
    """Aggregate metrics for win/loss analysis"""
    total_closed_deals: int
    won_deals: int
    lost_deals: int
    win_rate: float
    avg_sales_cycle_won: float
    avg_sales_cycle_lost: float
    avg_deal_size_won: float
    avg_deal_size_lost: float
    median_time_to_close_won: float
    median_time_to_close_lost: float


@dataclass
class WinLossInsight:
    """High-level insight from win/loss analysis"""
    title: str
    description: str
    confidence: float  # 0-1
    actionable_recommendation: str


@dataclass
class WinLossAnalysisResult:
    """Complete win/loss pattern analysis result"""
    analysis_id: str
    metrics: WinLossMetrics
    win_patterns: List[WinPattern]
    loss_patterns: List[LossPattern]
    insights: List[WinLossInsight]
    top_win_factors: List[str]  # Top 3-5 factors that correlate with wins
    top_loss_factors: List[str]  # Top 3-5 factors that correlate with losses
    generated_at: str


class WinLossPatternService:
    """Service for detecting win/loss patterns using AI"""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"

    async def analyze_patterns(
        self,
        analysis_id: str,
        deals: List[Deal],
        open_deals: List[Deal] = None
    ) -> WinLossAnalysisResult:
        """
        Analyze win/loss patterns from historical closed deals.

        Args:
            analysis_id: ID of the analysis session
            deals: List of all deals (must include closed deals with dealStatus)
            open_deals: Optional list of currently open deals for context

        Returns:
            WinLossAnalysisResult with patterns, metrics, and insights
        """
        # Filter to closed deals only
        won_deals = [d for d in deals if d.dealStatus == "won"]
        lost_deals = [d for d in deals if d.dealStatus == "lost"]

        if len(won_deals) < 3 and len(lost_deals) < 3:
            # Not enough data for pattern analysis
            return self._create_insufficient_data_result(analysis_id, deals)

        # Calculate metrics
        metrics = self._calculate_metrics(won_deals, lost_deals)

        # Prepare data for AI analysis
        won_deals_data = [self._deal_to_dict(d) for d in won_deals]
        lost_deals_data = [self._deal_to_dict(d) for d in lost_deals]
        open_deals_data = [self._deal_to_dict(d) for d in (open_deals or [])]

        # Get AI analysis
        ai_result = await self._get_ai_pattern_analysis(
            won_deals_data,
            lost_deals_data,
            open_deals_data,
            metrics
        )

        return WinLossAnalysisResult(
            analysis_id=analysis_id,
            metrics=metrics,
            win_patterns=ai_result["win_patterns"],
            loss_patterns=ai_result["loss_patterns"],
            insights=ai_result["insights"],
            top_win_factors=ai_result["top_win_factors"],
            top_loss_factors=ai_result["top_loss_factors"],
            generated_at=datetime.utcnow().isoformat()
        )

    def _calculate_metrics(
        self,
        won_deals: List[Deal],
        lost_deals: List[Deal]
    ) -> WinLossMetrics:
        """Calculate aggregate win/loss metrics"""
        total_closed = len(won_deals) + len(lost_deals)
        won_count = len(won_deals)
        lost_count = len(lost_deals)

        win_rate = (won_count / total_closed * 100) if total_closed > 0 else 0

        # Calculate sales cycle lengths
        won_cycles = [
            d.salesCycleLength for d in won_deals
            if d.salesCycleLength is not None
        ]
        lost_cycles = [
            d.salesCycleLength for d in lost_deals
            if d.salesCycleLength is not None
        ]

        avg_cycle_won = sum(won_cycles) / len(won_cycles) if won_cycles else 0
        avg_cycle_lost = sum(lost_cycles) / len(lost_cycles) if lost_cycles else 0

        # Calculate deal sizes
        won_amounts = [d.amount for d in won_deals if d.amount is not None]
        lost_amounts = [d.amount for d in lost_deals if d.amount is not None]

        avg_size_won = sum(won_amounts) / len(won_amounts) if won_amounts else 0
        avg_size_lost = sum(lost_amounts) / len(lost_amounts) if lost_amounts else 0

        # Median time to close
        median_won = sorted(won_cycles)[len(won_cycles) // 2] if won_cycles else 0
        median_lost = sorted(lost_cycles)[len(lost_cycles) // 2] if lost_cycles else 0

        return WinLossMetrics(
            total_closed_deals=total_closed,
            won_deals=won_count,
            lost_deals=lost_count,
            win_rate=win_rate,
            avg_sales_cycle_won=avg_cycle_won,
            avg_sales_cycle_lost=avg_cycle_lost,
            avg_deal_size_won=avg_size_won,
            avg_deal_size_lost=avg_size_lost,
            median_time_to_close_won=median_won,
            median_time_to_close_lost=median_lost
        )

    def _deal_to_dict(self, deal: Deal) -> Dict[str, Any]:
        """Convert Deal model to dictionary for AI analysis"""
        return {
            "id": deal.id,
            "name": deal.name,
            "amount": deal.amount,
            "stage": deal.stage,
            "closeDate": deal.closeDate.isoformat() if deal.closeDate else None,
            "createdDate": deal.createdDate.isoformat() if deal.createdDate else None,
            "actualCloseDate": deal.actualCloseDate.isoformat() if deal.actualCloseDate else None,
            "lastActivityDate": deal.lastActivityDate.isoformat() if deal.lastActivityDate else None,
            "dealStatus": deal.dealStatus,
            "wonReason": deal.wonReason,
            "lostReason": deal.lostReason,
            "dealType": deal.dealType,
            "salesCycleLength": deal.salesCycleLength,
            "daysToClose": deal.daysToClose,
            "ownerName": deal.ownerName,
            "accountName": deal.accountName,
            "leadSource": deal.leadSource,
            "industry": deal.industry,
            "probability": deal.probability,
            "forecastCategory": deal.forecastCategory
        }

    async def _get_ai_pattern_analysis(
        self,
        won_deals: List[Dict],
        lost_deals: List[Dict],
        open_deals: List[Dict],
        metrics: WinLossMetrics
    ) -> Dict[str, Any]:
        """Use Claude to identify patterns in win/loss data"""

        prompt = self._build_pattern_analysis_prompt(
            won_deals,
            lost_deals,
            open_deals,
            metrics
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse AI response
            content = response.content[0].text

            # Extract JSON from response
            result = self._parse_ai_response(content)

            return result

        except Exception as e:
            print(f"Error in AI pattern analysis: {e}")
            # Return empty patterns on error
            return {
                "win_patterns": [],
                "loss_patterns": [],
                "insights": [],
                "top_win_factors": [],
                "top_loss_factors": []
            }

    def _build_pattern_analysis_prompt(
        self,
        won_deals: List[Dict],
        lost_deals: List[Dict],
        open_deals: List[Dict],
        metrics: WinLossMetrics
    ) -> str:
        """Build the AI prompt for pattern analysis"""

        return f"""You are an expert sales analyst. Analyze the following closed deals to identify patterns that distinguish wins from losses.

# AGGREGATE METRICS
- Total Closed Deals: {metrics.total_closed_deals}
- Won: {metrics.won_deals} ({metrics.win_rate:.1f}%)
- Lost: {metrics.lost_deals} ({100 - metrics.win_rate:.1f}%)
- Avg Sales Cycle (Won): {metrics.avg_sales_cycle_won:.0f} days
- Avg Sales Cycle (Lost): {metrics.avg_sales_cycle_lost:.0f} days
- Avg Deal Size (Won): ${metrics.avg_deal_size_won:,.0f}
- Avg Deal Size (Lost): ${metrics.avg_deal_size_lost:,.0f}

# WON DEALS ({len(won_deals)} total)
{json.dumps(won_deals, indent=2)}

# LOST DEALS ({len(lost_deals)} total)
{json.dumps(lost_deals, indent=2)}

# CURRENT OPEN PIPELINE ({len(open_deals)} deals)
{json.dumps(open_deals[:10], indent=2) if open_deals else "No open deals"}

# YOUR TASK
Analyze the data and identify:

1. **Win Patterns**: What do your wins have in common? Look for patterns in:
   - Sales cycle length (time to close)
   - Deal size/amount
   - Engagement patterns (activity frequency, staleness)
   - Stage progression
   - Stakeholder involvement timing
   - Lead source or industry
   - Deal type (new business, expansion, renewal)

2. **Loss Patterns**: What characteristics correlate with losses? Look for:
   - Long sales cycles (what threshold?)
   - Low engagement/activity
   - Missing critical milestones
   - Deal size patterns
   - Stage where most deals are lost

3. **Actionable Insights**: What should the team do differently?

4. **Apply to Current Pipeline**: Which open deals show warning signs?

# OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{{
  "win_patterns": [
    {{
      "pattern_type": "engagement|timeline|stakeholder|process",
      "description": "Specific pattern found in wins",
      "frequency": 75.5,
      "example": "3 of 4 wins had CFO engaged by day 15",
      "impact_score": 85
    }}
  ],
  "loss_patterns": [
    {{
      "pattern_type": "engagement|timeline|stakeholder|process",
      "description": "Specific pattern found in losses",
      "frequency": 73.0,
      "example": "Deals over 90 days correlate with 73% loss rate",
      "impact_score": 90
    }}
  ],
  "insights": [
    {{
      "title": "Short, punchy insight title",
      "description": "2-3 sentence explanation",
      "confidence": 0.85,
      "actionable_recommendation": "Specific action the team should take"
    }}
  ],
  "top_win_factors": [
    "25% higher engagement in discovery phase",
    "CFO involved by day 15",
    "POC completed within 30 days"
  ],
  "top_loss_factors": [
    "Sales cycles over 90 days correlate with 73% loss rate",
    "No activity for 14+ days",
    "Missing executive sponsor"
  ]
}}

BE SPECIFIC with numbers and thresholds. Don't say "faster sales cycles" - say "deals closed in under 45 days have 80% win rate".
"""

    def _parse_ai_response(self, content: str) -> Dict[str, Any]:
        """Parse AI response and extract structured data"""
        try:
            # Try to find JSON in the response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                data = json.loads(json_str)

                # Convert dictionaries to dataclasses
                win_patterns = [
                    WinPattern(**p) for p in data.get("win_patterns", [])
                ]
                loss_patterns = [
                    LossPattern(**p) for p in data.get("loss_patterns", [])
                ]
                insights = [
                    WinLossInsight(**i) for i in data.get("insights", [])
                ]

                return {
                    "win_patterns": win_patterns,
                    "loss_patterns": loss_patterns,
                    "insights": insights,
                    "top_win_factors": data.get("top_win_factors", []),
                    "top_loss_factors": data.get("top_loss_factors", [])
                }
            else:
                raise ValueError("No JSON found in AI response")

        except Exception as e:
            print(f"Error parsing AI response: {e}")
            print(f"Response content: {content[:500]}")
            return {
                "win_patterns": [],
                "loss_patterns": [],
                "insights": [],
                "top_win_factors": [],
                "top_loss_factors": []
            }

    def _create_insufficient_data_result(
        self,
        analysis_id: str,
        deals: List[Deal]
    ) -> WinLossAnalysisResult:
        """Create a result when there's insufficient closed deal data"""

        metrics = WinLossMetrics(
            total_closed_deals=0,
            won_deals=0,
            lost_deals=0,
            win_rate=0,
            avg_sales_cycle_won=0,
            avg_sales_cycle_lost=0,
            avg_deal_size_won=0,
            avg_deal_size_lost=0,
            median_time_to_close_won=0,
            median_time_to_close_lost=0
        )

        insight = WinLossInsight(
            title="Insufficient Data",
            description="Need at least 3 won and 3 lost deals to identify meaningful patterns. Continue tracking deal outcomes to unlock win/loss insights.",
            confidence=1.0,
            actionable_recommendation="Mark completed deals as 'won' or 'lost' in your CRM to enable pattern detection."
        )

        return WinLossAnalysisResult(
            analysis_id=analysis_id,
            metrics=metrics,
            win_patterns=[],
            loss_patterns=[],
            insights=[insight],
            top_win_factors=[],
            top_loss_factors=[],
            generated_at=datetime.utcnow().isoformat()
        )
