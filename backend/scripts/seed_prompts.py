"""
Seed script to initialize prompts from current hardcoded values.
Run this after migration to populate the prompts table.

Usage:
    cd backend
    poetry run python scripts/seed_prompts.py
"""

import asyncio
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from prisma import Prisma
from prisma.enums import PromptCategory
from prisma import Json
from app.services.encryption_service import get_encryption_service

# Current prompts extracted from ai_service.py
DEAL_ANALYSIS_PROMPT = """You are an elite B2B sales coach with 20 years of experience analyzing enterprise deals. You have a deep understanding of deal psychology, buyer behavior, and pipeline dynamics.

DEAL SNAPSHOT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deal:        {{deal_name}}
Value:       ${{deal_amount}}
Stage:       {{deal_stage}}
Close Date:  {{close_date}}
Owner:       {{owner}}
Account:     {{account}}
Contact:     {{primary_contact}}
Created:     {{created_date}}
Last Touch:  {{last_activity}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA QUALITY ASSESSMENT:
{{violations_text}}

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
   List 3-5 specific, concrete risk factors. Be direct.

3. NEXT BEST ACTION:
   ONE specific action the AE should take in the next 24 hours.

4. ACTION PRIORITY:
   - critical: Deal will slip/lose without immediate action (today)
   - high: Action needed this week to prevent issues
   - medium: Action needed but not urgent
   - low: Nice to have, no immediate risk

5. ACTION RATIONALE:
   Explain WHY this action matters.

6. EXECUTIVE SUMMARY:
   Write exactly 2 sentences.

7. CONFIDENCE:
   Your confidence in this analysis (0.0 to 1.0)

RESPONSE FORMAT - VALID JSON ONLY:
{
  "risk_score": <number 0-100>,
  "risk_level": "<low|medium|high>",
  "risk_factors": ["factor 1", "factor 2", "factor 3"],
  "next_best_action": "Specific action to take",
  "action_priority": "<critical|high|medium|low>",
  "action_rationale": "Why this action will move the deal forward",
  "executive_summary": "Two sentence summary for pipeline reviews.",
  "confidence": <number 0.0-1.0>,
  "slip_probability": <number 0-100>,
  "expected_close_date": "YYYY-MM-DD or null",
  "deal_health_indicators": {
    "data_completeness": <number 0-100>,
    "activity_momentum": <number 0-100>,
    "stakeholder_engagement": <number 0-100>,
    "timeline_realism": <number 0-100>
  }
}

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown, no code blocks, no explanations
- Be specific and actionable
- Be honest about risks
- Focus on what AE can control

BEGIN ANALYSIS:"""

PIPELINE_ANALYSIS_PROMPT = """You are an elite B2B sales coach analyzing {{deal_count}} deals in a pipeline. Analyze each deal and return a JSON array with risk assessments.

DEALS TO ANALYZE:
{{deals_data}}

For EACH deal, provide analysis in this EXACT JSON format:
{
  "deal_id": "<deal_id from input>",
  "deal_name": "<deal_name from input>",
  "risk_score": <number 0-100, where 100 is highest risk>,
  "risk_level": "<low|medium|high>",
  "risk_factors": ["factor 1", "factor 2", "factor 3"],
  "next_best_action": "<specific action the AE should take>",
  "action_priority": "<critical|high|medium|low>",
  "action_rationale": "<why this action matters>",
  "executive_summary": "<2-sentence summary>",
  "confidence": <0.0-1.0>
}

CRITICAL RULES:
- Return a JSON ARRAY with one object per deal
- Output ONLY valid JSON, no markdown, no code blocks
- Analyze all {{deal_count}} deals
- Be specific and actionable
- Focus on what the AE can control

BEGIN ANALYSIS:"""

PIPELINE_SUMMARY_PROMPT = """You are a sales operations executive preparing a pipeline review summary.

PIPELINE SNAPSHOT:
- Total Deals: {{total_deals}}
- Total Value: ${{total_value}}
- High Risk Deals: {{high_risk_count}} (${{high_risk_value}})

TOP 3 AT-RISK DEALS:
{{top_risks_text}}

TASK:
Create an executive summary for a VP-level pipeline review.

RESPONSE FORMAT (JSON):
{
  "overall_health": "<excellent|good|concerning|critical>",
  "health_score": <number 0-100>,
  "key_insight": "One sentence key takeaway",
  "top_3_risks": [
    {
      "deal_name": "Deal name",
      "deal_value": <number>,
      "risk_score": <number>,
      "why_at_risk": "Brief explanation",
      "defense_talking_point": "How to defend this deal to VP"
    }
  ],
  "recommended_focus": "Where team should focus attention this week",
  "forecast_impact": "How these risks impact forecast accuracy"
}

Output ONLY valid JSON:"""

FIELD_MAPPING_PROMPT = """You are a field mapping expert for CRM data. Your task is to map uploaded CSV column names to standard RevTrust fields.

Standard RevTrust Fields:
{{standard_fields}}

CSV Column Headers:
{{csv_headers}}

{{sample_data_section}}

Please analyze the CSV headers and create a mapping to the standard fields.

Return ONLY a valid JSON object in this exact format:
{
  "mappings": {
    "csv_column_name": {
      "standard_field": "field_name or null",
      "confidence": 0.95,
      "reasoning": "explanation"
    }
  },
  "unmapped_required_fields": ["list", "of", "required", "fields", "not", "mapped"],
  "warnings": ["any warnings about the mapping"]
}"""


PROMPTS_TO_SEED = [
    {
        "slug": "deal_analysis",
        "name": "Deal Analysis",
        "description": "Analyzes individual deals for risk assessment, providing risk scores, risk factors, next best actions, and executive summaries.",
        "category": PromptCategory.ANALYSIS,
        "content": DEAL_ANALYSIS_PROMPT,
        "max_tokens": 1500,
        "temperature": 0.0,
    },
    {
        "slug": "pipeline_analysis",
        "name": "Pipeline Batch Analysis",
        "description": "Batch analyzes multiple deals in a pipeline, returning risk assessments for each deal in a single API call.",
        "category": PromptCategory.ANALYSIS,
        "content": PIPELINE_ANALYSIS_PROMPT,
        "max_tokens": 8000,
        "temperature": 0.0,
    },
    {
        "slug": "pipeline_summary",
        "name": "Pipeline Executive Summary",
        "description": "Generates executive-level pipeline summary with overall health, top risks, and strategic recommendations.",
        "category": PromptCategory.ANALYSIS,
        "content": PIPELINE_SUMMARY_PROMPT,
        "max_tokens": 2000,
        "temperature": 0.0,
    },
    {
        "slug": "field_mapping",
        "name": "CSV Field Mapping",
        "description": "Intelligently maps CSV column headers to standard RevTrust fields using AI-powered matching.",
        "category": PromptCategory.MAPPING,
        "content": FIELD_MAPPING_PROMPT,
        "max_tokens": 2000,
        "temperature": 0.0,
    },
    {
        "slug": "account_research",
        "name": "Account Research",
        "description": "Researches accounts to provide insights for sales preparation. (Coming soon)",
        "category": PromptCategory.RESEARCH,
        "content": "{{account_name}} research prompt - to be implemented",
        "max_tokens": 4000,
        "temperature": 0.0,
    },
    {
        "slug": "forecast_coaching",
        "name": "Forecast Coaching",
        "description": "Provides coaching insights for forecast accuracy improvement. (Coming soon)",
        "category": PromptCategory.FORECASTING,
        "content": "Forecast coaching prompt - to be implemented",
        "max_tokens": 3000,
        "temperature": 0.0,
    },
]


async def seed_prompts():
    """Seed initial prompts into the database"""
    
    print("Starting prompt seeding...")
    
    prisma = Prisma()
    await prisma.connect()
    
    try:
        # Check if ANTHROPIC_API_KEY is set to create initial provider
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        provider_id = None
        
        if anthropic_key:
            # Check if provider already exists
            existing_provider = await prisma.llmprovider.find_unique(
                where={"name": "anthropic"}
            )
            
            if existing_provider:
                print("Anthropic provider already exists")
                provider_id = existing_provider.id
            else:
                print("Creating Anthropic provider from environment...")
                encryption = get_encryption_service()
                encrypted_key = encryption.encrypt(anthropic_key)
                
                provider = await prisma.llmprovider.create(
                    data={
                        "name": "anthropic",
                        "displayName": "Anthropic Claude",
                        "apiKeyEncrypted": encrypted_key,
                        "availableModels": Json([
                            "claude-sonnet-4-20250514",
                            "claude-opus-4-20250514",
                            "claude-sonnet-4-5-20250929",
                            "claude-3-5-sonnet-20241022",
                            "claude-3-haiku-20240307",
                        ]),
                        "defaultModel": "claude-sonnet-4-20250514",
                        "createdBy": "system",
                        "testStatus": "untested",
                    }
                )
                provider_id = provider.id
                print(f"Created Anthropic provider: {provider.id}")
        else:
            print("ANTHROPIC_API_KEY not set - skipping provider creation")
            
            # Check if any provider exists
            any_provider = await prisma.llmprovider.find_first()
            if any_provider:
                provider_id = any_provider.id
                print(f"Using existing provider: {any_provider.name}")
        
        if not provider_id:
            print("No LLM provider available. Please create one first.")
            return
        
        # Seed prompts
        for prompt_data in PROMPTS_TO_SEED:
            existing = await prisma.prompt.find_unique(
                where={"slug": prompt_data["slug"]}
            )
            
            if existing:
                print(f"Prompt '{prompt_data['slug']}' already exists, skipping")
                continue
            
            # Create prompt
            prompt = await prisma.prompt.create(
                data={
                    "slug": prompt_data["slug"],
                    "name": prompt_data["name"],
                    "description": prompt_data["description"],
                    "category": prompt_data["category"],
                    "providerId": provider_id,
                    "model": "claude-sonnet-4-20250514",
                    "maxTokens": prompt_data["max_tokens"],
                    "temperature": prompt_data["temperature"],
                    "isSystemPrompt": True,
                }
            )
            
            # Create initial version
            version = await prisma.promptversion.create(
                data={
                    "promptId": prompt.id,
                    "version": 1,
                    "content": prompt_data["content"],
                    "changeNote": "Initial version from codebase",
                    "createdBy": "system",
                }
            )
            
            # Set active version
            await prisma.prompt.update(
                where={"id": prompt.id},
                data={"activeVersionId": version.id}
            )
            
            print(f"Created prompt '{prompt_data['slug']}' with version 1")
        
        print("\nPrompt seeding complete!")
        
    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_prompts())
