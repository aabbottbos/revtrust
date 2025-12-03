"""
AI Service Abstraction Layer
Supports multiple AI providers (Claude, OpenAI, Gemini)
Switch providers by changing environment variables
"""

import os
import json
from typing import List, Dict, Optional, Any
from abc import ABC, abstractmethod
from dataclasses import dataclass
import anthropic


@dataclass
class AIAnalysisResult:
    """Standardized AI analysis result"""
    deal_id: str
    deal_name: str
    risk_score: float  # 0-100 (0 = no risk, 100 = high risk)
    risk_level: str  # "low", "medium", "high"
    risk_factors: List[str]
    next_best_action: str
    action_priority: str  # "critical", "high", "medium", "low"
    action_rationale: str
    executive_summary: str
    confidence: float  # 0-1


class AIProvider(ABC):
    """Abstract base class for AI providers"""

    @abstractmethod
    async def analyze_deal(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> AIAnalysisResult:
        """Analyze a single deal and return insights"""
        pass

    @abstractmethod
    async def analyze_pipeline(
        self,
        deals: List[Dict[str, Any]],
        violations_by_deal: Dict[str, List[Dict[str, Any]]]
    ) -> List[AIAnalysisResult]:
        """Analyze entire pipeline and return insights for all deals"""
        pass


class ClaudeProvider(AIProvider):
    """Claude (Anthropic) AI provider"""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")

        self.model = os.getenv("AI_MODEL", "claude-sonnet-4-20250514")
        self.client = anthropic.Anthropic(api_key=self.api_key)

    def _create_deal_analysis_prompt(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> str:
        """Create enhanced prompt for comprehensive deal analysis"""

        # Calculate days in stage
        created_date = deal_data.get('created_date', '')
        close_date = deal_data.get('close_date', '')
        last_activity = deal_data.get('last_activity_date', '')

        # Format violations by severity
        critical_violations = [v for v in violations if v.get('severity') == 'critical']
        warning_violations = [v for v in violations if v.get('severity') == 'warning']
        info_violations = [v for v in violations if v.get('severity') == 'info']

        violations_text = ""
        if critical_violations:
            violations_text += "CRITICAL ISSUES:\n"
            violations_text += "\n".join([
                f"- {v.get('rule_name', 'Unknown')}: {v.get('message', '')}"
                for v in critical_violations
            ])
            violations_text += "\n\n"

        if warning_violations:
            violations_text += "WARNINGS:\n"
            violations_text += "\n".join([
                f"- {v.get('rule_name', 'Unknown')}: {v.get('message', '')}"
                for v in warning_violations
            ])
            violations_text += "\n\n"

        if info_violations:
            violations_text += "INFO:\n"
            violations_text += "\n".join([
                f"- {v.get('rule_name', 'Unknown')}: {v.get('message', '')}"
                for v in info_violations
            ])

        if not violations_text:
            violations_text = "No issues identified - deal appears clean"

        prompt = f"""You are an elite B2B sales coach with 20 years of experience analyzing enterprise deals. You have a deep understanding of deal psychology, buyer behavior, and pipeline dynamics.

DEAL SNAPSHOT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deal:        {deal_data.get('name', 'Unknown')}
Value:       ${deal_data.get('amount', 0):,.2f}
Stage:       {deal_data.get('stage', 'Unknown')}
Close Date:  {close_date}
Owner:       {deal_data.get('owner', 'Not set')}
Account:     {deal_data.get('account', 'Not set')}
Contact:     {deal_data.get('primary_contact', 'Not set')}
Created:     {created_date}
Last Touch:  {last_activity}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA QUALITY ASSESSMENT:
{violations_text}

YOUR MISSION:
As this AE's personal coach, analyze this deal with brutal honesty and provide actionable guidance they can execute TODAY.

ANALYSIS FRAMEWORK:

1. RISK ASSESSMENT (0-100 scale):
   - 0-30: Low risk (on track, minor issues only)
   - 31-60: Medium risk (needs attention, fixable problems)
   - 61-100: High risk (serious issues, likely to slip/lose)

   Consider:
   - Deal value vs typical deal size
   - Time in stage vs typical sales cycle
   - Data quality (missing info = red flag)
   - Activity patterns (staleness = death)
   - Close date realism
   - Stage progression logic

2. RISK FACTORS:
   List 3-5 specific, concrete risk factors. Be direct. Examples:
   - "No activity in 14 days on a $75K deal suggests ghosting"
   - "Close date passed 18 days ago - deal is already lost or needs urgent update"
   - "Missing primary contact = no champion, high risk"
   - "Stage 'Negotiation' but no recent activity = stalled, not progressing"

3. NEXT BEST ACTION:
   ONE specific action the AE should take in the next 24 hours. Format:
   "[ACTION VERB] [SPECIFIC TASK] with [WHO] about [WHAT]"

   Examples of GOOD actions:
   - "Call John Smith (champion) to confirm budget approval timeline"
   - "Schedule 30-min executive briefing with CFO to address pricing concerns"
   - "Send contract redlines to legal contact by EOD with 48hr response deadline"

   Examples of BAD actions (too vague):
   - "Follow up" ❌
   - "Check in" ❌
   - "Review deal" ❌

4. ACTION PRIORITY:
   - critical: Deal will slip/lose without immediate action (today)
   - high: Action needed this week to prevent issues
   - medium: Action needed but not urgent
   - low: Nice to have, no immediate risk

5. ACTION RATIONALE:
   Explain WHY this action matters. Include:
   - What risk it mitigates
   - What progress it unlocks
   - Data/pattern that suggests it (e.g., "Deals at this stage close 3x faster with executive engagement")

6. EXECUTIVE SUMMARY:
   Write exactly 2 sentences. First sentence: deal status. Second sentence: key risk or opportunity.
   Example: "High-value enterprise deal in negotiation stage showing signs of stalling. Lack of executive engagement and 14-day activity gap suggest need for immediate champion reengagement."

7. CONFIDENCE:
   Your confidence in this analysis (0.0 to 1.0):
   - 0.9-1.0: Complete data, clear patterns
   - 0.7-0.89: Good data, some uncertainty
   - 0.5-0.69: Limited data, moderate uncertainty
   - <0.5: Insufficient data for strong recommendations

RESPONSE FORMAT - VALID JSON ONLY:
{{
  "risk_score": <number 0-100>,
  "risk_level": "<low|medium|high>",
  "risk_factors": [
    "Specific risk factor 1",
    "Specific risk factor 2",
    "Specific risk factor 3"
  ],
  "next_best_action": "Specific action to take",
  "action_priority": "<critical|high|medium|low>",
  "action_rationale": "Why this action will move the deal forward",
  "executive_summary": "Two sentence summary for pipeline reviews.",
  "confidence": <number 0.0-1.0>,
  "slip_probability": <number 0-100>,
  "expected_close_date": "YYYY-MM-DD or null",
  "deal_health_indicators": {{
    "data_completeness": <number 0-100>,
    "activity_momentum": <number 0-100>,
    "stakeholder_engagement": <number 0-100>,
    "timeline_realism": <number 0-100>
  }}
}}

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown, no code blocks, no explanations
- Be specific and actionable
- Be honest about risks
- Focus on what AE can control
- Use data to support recommendations

BEGIN ANALYSIS:"""

        return prompt

    async def analyze_deal(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> AIAnalysisResult:
        """Analyze single deal using Claude"""

        try:
            prompt = self._create_deal_analysis_prompt(deal_data, violations)

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse response
            response_text = response.content[0].text

            # Clean response (remove markdown if present)
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            result = json.loads(response_text)

            # Create standardized result
            return AIAnalysisResult(
                deal_id=deal_data.get("id", "unknown"),
                deal_name=deal_data.get("name", "Unknown"),
                risk_score=float(result.get("risk_score", 50)),
                risk_level=result.get("risk_level", "medium"),
                risk_factors=result.get("risk_factors", []),
                next_best_action=result.get("next_best_action", "Review deal details"),
                action_priority=result.get("action_priority", "medium"),
                action_rationale=result.get("action_rationale", ""),
                executive_summary=result.get("executive_summary", ""),
                confidence=float(result.get("confidence", 0.7))
            )

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response text: {response_text}")
            # Return default result
            return self._create_default_result(deal_data, "Failed to parse AI response")
        except Exception as e:
            print(f"Error analyzing deal: {e}")
            return self._create_default_result(deal_data, str(e))

    async def analyze_pipeline(
        self,
        deals: List[Dict[str, Any]],
        violations_by_deal: Dict[str, List[Dict[str, Any]]]
    ) -> List[AIAnalysisResult]:
        """Analyze all deals in pipeline"""

        results = []
        for deal in deals:
            deal_id = deal.get("id", "unknown")
            violations = violations_by_deal.get(deal_id, [])
            result = await self.analyze_deal(deal, violations)
            results.append(result)

        return results

    async def generate_pipeline_summary(
        self,
        deals: List[Dict[str, Any]],
        ai_results: List[AIAnalysisResult]
    ) -> Dict[str, Any]:
        """Generate executive summary of entire pipeline"""

        # Calculate pipeline metrics
        total_deals = len(deals)
        total_value = sum(d.get('amount', 0) for d in deals)
        high_risk_deals = [r for r in ai_results if r.risk_level == 'high']
        high_risk_value = sum(
            next((d.get('amount', 0) for d in deals if d.get('id') == r.deal_id), 0)
            for r in high_risk_deals
        )

        # Get top 3 at-risk deals
        top_risks = sorted(ai_results, key=lambda x: x.risk_score, reverse=True)[:3]

        # Create summary prompt
        top_risks_text = "\n".join([
            f"{i+1}. {r.deal_name} (${next((d.get('amount', 0) for d in deals if d.get('id') == r.deal_id), 0):,.0f}) - Risk: {r.risk_score}/100\n   Reason: {r.risk_factors[0] if r.risk_factors else 'Unknown'}"
            for i, r in enumerate(top_risks)
        ])

        prompt = f"""You are a sales operations executive preparing a pipeline review summary.

PIPELINE SNAPSHOT:
- Total Deals: {total_deals}
- Total Value: ${total_value:,.2f}
- High Risk Deals: {len(high_risk_deals)} (${high_risk_value:,.2f})

TOP 3 AT-RISK DEALS:
{top_risks_text}

TASK:
Create an executive summary for a VP-level pipeline review. Be concise, data-driven, and actionable.

RESPONSE FORMAT (JSON):
{{
  "overall_health": "<excellent|good|concerning|critical>",
  "health_score": <number 0-100>,
  "key_insight": "One sentence key takeaway",
  "top_3_risks": [
    {{
      "deal_name": "Deal name",
      "deal_value": <number>,
      "risk_score": <number>,
      "why_at_risk": "Brief explanation",
      "defense_talking_point": "How to defend this deal to VP"
    }}
  ],
  "recommended_focus": "Where team should focus attention this week",
  "forecast_impact": "How these risks impact forecast accuracy"
}}

Output ONLY valid JSON:"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()

            # Clean response
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            result = json.loads(response_text)
            return result

        except Exception as e:
            print(f"Error generating pipeline summary: {e}")
            return {
                "overall_health": "unknown",
                "health_score": 50,
                "key_insight": "Unable to generate summary",
                "top_3_risks": [],
                "recommended_focus": "Review pipeline manually",
                "forecast_impact": "Unknown"
            }

    def _create_default_result(
        self,
        deal_data: Dict[str, Any],
        error_msg: str
    ) -> AIAnalysisResult:
        """Create default result when AI fails"""
        return AIAnalysisResult(
            deal_id=deal_data.get("id", "unknown"),
            deal_name=deal_data.get("name", "Unknown"),
            risk_score=50.0,
            risk_level="medium",
            risk_factors=[f"Analysis error: {error_msg}"],
            next_best_action="Review deal manually",
            action_priority="medium",
            action_rationale="AI analysis unavailable",
            executive_summary="Manual review required.",
            confidence=0.0
        )


class OpenAIProvider(AIProvider):
    """OpenAI GPT provider (for future use)"""

    def __init__(self):
        # TODO: Implement OpenAI integration
        raise NotImplementedError("OpenAI provider not yet implemented")

    async def analyze_deal(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> AIAnalysisResult:
        raise NotImplementedError()

    async def analyze_pipeline(
        self,
        deals: List[Dict[str, Any]],
        violations_by_deal: Dict[str, List[Dict[str, Any]]]
    ) -> List[AIAnalysisResult]:
        raise NotImplementedError()


class GeminiProvider(AIProvider):
    """Google Gemini provider (for future use)"""

    def __init__(self):
        # TODO: Implement Gemini integration
        raise NotImplementedError("Gemini provider not yet implemented")

    async def analyze_deal(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> AIAnalysisResult:
        raise NotImplementedError()

    async def analyze_pipeline(
        self,
        deals: List[Dict[str, Any]],
        violations_by_deal: Dict[str, List[Dict[str, Any]]]
    ) -> List[AIAnalysisResult]:
        raise NotImplementedError()


class AIService:
    """Main AI service - automatically selects provider based on env vars"""

    def __init__(self):
        self.provider_name = os.getenv("AI_PROVIDER", "claude").lower()

        if self.provider_name == "claude":
            self.provider = ClaudeProvider()
        elif self.provider_name == "openai":
            self.provider = OpenAIProvider()
        elif self.provider_name == "gemini":
            self.provider = GeminiProvider()
        else:
            raise ValueError(f"Unknown AI provider: {self.provider_name}")

    async def analyze_deal(
        self,
        deal_data: Dict[str, Any],
        violations: List[Dict[str, Any]]
    ) -> AIAnalysisResult:
        """Analyze a single deal"""
        return await self.provider.analyze_deal(deal_data, violations)

    async def analyze_pipeline(
        self,
        deals: List[Dict[str, Any]],
        violations_by_deal: Dict[str, List[Dict[str, Any]]]
    ) -> List[AIAnalysisResult]:
        """Analyze entire pipeline"""
        return await self.provider.analyze_pipeline(deals, violations_by_deal)

    async def generate_pipeline_summary(
        self,
        deals: List[Dict[str, Any]],
        ai_results: List[AIAnalysisResult]
    ) -> Dict[str, Any]:
        """Generate executive pipeline summary"""
        if hasattr(self.provider, 'generate_pipeline_summary'):
            return await self.provider.generate_pipeline_summary(deals, ai_results)
        else:
            return {
                "overall_health": "unknown",
                "health_score": 50,
                "key_insight": "Pipeline summary not available",
                "top_3_risks": [],
                "recommended_focus": "Review deals manually",
                "forecast_impact": "Unknown"
            }


# Factory function for easy use
def get_ai_service() -> AIService:
    """Get configured AI service instance"""
    return AIService()
