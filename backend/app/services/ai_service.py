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
        """Create prompt for analyzing a single deal"""

        violations_text = "\n".join([
            f"- [{v.get('severity', 'info').upper()}] {v.get('rule_name', 'Unknown')}: {v.get('message', '')}"
            for v in violations
        ])

        prompt = f"""You are an expert sales coach analyzing a deal in a B2B sales pipeline.

DEAL INFORMATION:
- Deal Name: {deal_data.get('name', 'Unknown')}
- Amount: ${deal_data.get('amount', 0):,.2f}
- Close Date: {deal_data.get('close_date', 'Not set')}
- Stage: {deal_data.get('stage', 'Unknown')}
- Owner: {deal_data.get('owner', 'Not set')}
- Account: {deal_data.get('account', 'Not set')}
- Primary Contact: {deal_data.get('primary_contact', 'Not set')}
- Last Activity: {deal_data.get('last_activity_date', 'Not set')}
- Created Date: {deal_data.get('created_date', 'Not set')}

IDENTIFIED ISSUES:
{violations_text if violations else "No issues identified"}

TASK:
Analyze this deal and provide:
1. Risk Score (0-100): How likely is this deal to slip, stall, or be lost?
2. Risk Factors: Specific reasons for the risk score
3. Next Best Action: The single most impactful action the AE should take NOW
4. Action Rationale: Why this action will move the deal forward
5. Executive Summary: A 2-sentence summary for pipeline reviews

RESPONSE FORMAT (JSON):
{{
  "risk_score": <number 0-100>,
  "risk_level": "<low|medium|high>",
  "risk_factors": ["factor 1", "factor 2", "factor 3"],
  "next_best_action": "Specific action to take",
  "action_priority": "<critical|high|medium|low>",
  "action_rationale": "Why this action matters",
  "executive_summary": "2-sentence summary",
  "confidence": <number 0-1>
}}

IMPORTANT:
- Be specific and actionable
- Consider deal value, timeline, and activity patterns
- Focus on what the AE can control
- Be direct and honest about risks
- Output ONLY valid JSON, no other text"""

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


# Factory function for easy use
def get_ai_service() -> AIService:
    """Get configured AI service instance"""
    return AIService()
