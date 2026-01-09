#!/usr/bin/env python3
"""
Deployment script for the /admin/prompts feature.

This script handles:
1. Checking required environment variables
2. Applying database schema changes
3. Seeding initial prompts and provider data

Usage:
    # For Railway deployment, set these env vars first:
    # - DATABASE_URL (Railway PostgreSQL connection string)
    # - ENCRYPTION_KEY (Fernet key for API key encryption)
    # - ANTHROPIC_API_KEY (optional, to auto-create provider)

    poetry run python scripts/deploy_prompts_feature.py

    # Or with explicit variables:
    DATABASE_URL="postgresql://..." ENCRYPTION_KEY="..." poetry run python scripts/deploy_prompts_feature.py
"""

import asyncio
import os
import sys
import subprocess

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Load .env but allow overrides
load_dotenv(override=False)

# PRODUCTION DATABASE URL - Set this explicitly to ensure we use prod
PROD_DATABASE_URL = "postgresql://postgres:QfPkHKpLUhtFYeewCuJaYGZuQPJdrQvK@yamanote.proxy.rlwy.net:58586/railway"

# Force the production DATABASE_URL
os.environ["DATABASE_URL"] = PROD_DATABASE_URL


def check_env_vars():
    """Check that required environment variables are set."""
    print("\n" + "=" * 60)
    print("STEP 1: Checking Environment Variables")
    print("=" * 60)

    required = {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "ENCRYPTION_KEY": os.getenv("ENCRYPTION_KEY"),
    }

    optional = {
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    }

    missing = [k for k, v in required.items() if not v]

    if missing:
        print(f"\n[ERROR] Missing required environment variables: {', '.join(missing)}")
        print("\nTo generate an ENCRYPTION_KEY, run:")
        print('  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"')
        return False

    # Mask sensitive values for display
    def mask(val):
        if not val:
            return "(not set)"
        if len(val) > 20:
            return f"{val[:8]}...{val[-4:]}"
        return f"{val[:4]}..."

    print("\nRequired variables:")
    for k, v in required.items():
        status = "[OK]" if v else "[MISSING]"
        print(f"  {status} {k}: {mask(v)}")

    print("\nOptional variables:")
    for k, v in optional.items():
        status = "[SET]" if v else "[NOT SET]"
        print(f"  {status} {k}: {mask(v) if v else '(will skip provider creation)'}")

    return True


def apply_schema():
    """Apply Prisma schema to database."""
    print("\n" + "=" * 60)
    print("STEP 2: Applying Database Schema")
    print("=" * 60)

    try:
        # Use db push for simplicity (works without migration history)
        result = subprocess.run(
            ["poetry", "run", "prisma", "db", "push", "--skip-generate"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )

        if result.returncode != 0:
            print(f"\n[ERROR] Schema push failed:")
            print(result.stderr)
            return False

        print("\n[OK] Database schema applied successfully")
        print(result.stdout)
        return True

    except Exception as e:
        print(f"\n[ERROR] Failed to apply schema: {e}")
        return False


async def seed_data():
    """Seed prompts and provider data."""
    print("\n" + "=" * 60)
    print("STEP 3: Seeding Data")
    print("=" * 60)

    from prisma import Prisma
    from prisma.enums import PromptCategory
    from prisma import Json
    from app.services.encryption_service import get_encryption_service

    prisma = Prisma()
    await prisma.connect()

    try:
        encryption = get_encryption_service()

        # Check/create Anthropic provider
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        provider_id = None

        existing_provider = await prisma.llmprovider.find_unique(
            where={"name": "anthropic"}
        )

        if existing_provider:
            print(f"\n[OK] Anthropic provider already exists (id: {existing_provider.id})")
            provider_id = existing_provider.id
        elif anthropic_key:
            print("\n[...] Creating Anthropic provider...")
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
            print(f"[OK] Created Anthropic provider (id: {provider.id})")
        else:
            # Check if any provider exists
            any_provider = await prisma.llmprovider.find_first()
            if any_provider:
                provider_id = any_provider.id
                print(f"\n[OK] Using existing provider: {any_provider.name} (id: {any_provider.id})")
            else:
                print("\n[WARN] No ANTHROPIC_API_KEY set and no existing provider found.")
                print("       You'll need to add a provider manually via /admin/prompts")

        # Seed prompts
        prompts_data = [
            {
                "slug": "deal_analysis",
                "name": "Deal Analysis",
                "description": "Analyzes individual deals for risk assessment, providing risk scores, risk factors, next best actions, and executive summaries.",
                "category": PromptCategory.ANALYSIS,
                "max_tokens": 1500,
            },
            {
                "slug": "pipeline_analysis",
                "name": "Pipeline Batch Analysis",
                "description": "Batch analyzes multiple deals in a pipeline, returning risk assessments for each deal in a single API call.",
                "category": PromptCategory.ANALYSIS,
                "max_tokens": 8000,
            },
            {
                "slug": "pipeline_summary",
                "name": "Pipeline Executive Summary",
                "description": "Generates executive-level pipeline summary with overall health, top risks, and strategic recommendations.",
                "category": PromptCategory.ANALYSIS,
                "max_tokens": 2000,
            },
            {
                "slug": "field_mapping",
                "name": "CSV Field Mapping",
                "description": "Intelligently maps CSV column headers to standard RevTrust fields using AI-powered matching.",
                "category": PromptCategory.MAPPING,
                "max_tokens": 2000,
            },
            {
                "slug": "account_research",
                "name": "Account Research",
                "description": "Researches accounts to provide insights for sales preparation. (Coming soon)",
                "category": PromptCategory.RESEARCH,
                "max_tokens": 4000,
            },
            {
                "slug": "forecast_coaching",
                "name": "Forecast Coaching",
                "description": "Provides coaching insights for forecast accuracy improvement. (Coming soon)",
                "category": PromptCategory.FORECASTING,
                "max_tokens": 3000,
            },
        ]

        print(f"\n[...] Checking {len(prompts_data)} prompts...")

        created = 0
        skipped = 0

        for p in prompts_data:
            existing = await prisma.prompt.find_unique(
                where={"slug": p["slug"]}
            )

            if existing:
                print(f"  [SKIP] {p['slug']} (already exists)")
                skipped += 1
                continue

            if not provider_id:
                print(f"  [SKIP] {p['slug']} (no provider available)")
                skipped += 1
                continue

            # Create prompt
            prompt = await prisma.prompt.create(
                data={
                    "slug": p["slug"],
                    "name": p["name"],
                    "description": p["description"],
                    "category": p["category"],
                    "providerId": provider_id,
                    "model": "claude-sonnet-4-20250514",
                    "maxTokens": p["max_tokens"],
                    "temperature": 0.0,
                    "isSystemPrompt": True,
                }
            )

            # Create initial version with placeholder content
            version = await prisma.promptversion.create(
                data={
                    "promptId": prompt.id,
                    "version": 1,
                    "content": f"Prompt content for {p['slug']} - to be configured",
                    "changeNote": "Initial version from deployment",
                    "createdBy": "system",
                }
            )

            # Set active version
            await prisma.prompt.update(
                where={"id": prompt.id},
                data={"activeVersionId": version.id}
            )

            print(f"  [OK] Created {p['slug']}")
            created += 1

        print(f"\n[OK] Seeding complete: {created} created, {skipped} skipped")
        return True

    except Exception as e:
        print(f"\n[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await prisma.disconnect()


def generate_encryption_key():
    """Generate a new Fernet encryption key."""
    from cryptography.fernet import Fernet
    return Fernet.generate_key().decode()


async def main():
    print("\n" + "=" * 60)
    print("  RevTrust /admin/prompts Feature Deployment")
    print("=" * 60)

    # Step 1: Check environment
    if not check_env_vars():
        print("\n[ABORT] Please set the required environment variables and try again.")

        # Offer to generate encryption key
        print("\n" + "-" * 60)
        response = input("Would you like to generate a new ENCRYPTION_KEY? (y/n): ")
        if response.lower() == 'y':
            key = generate_encryption_key()
            print(f"\nGenerated ENCRYPTION_KEY:\n{key}")
            print("\nAdd this to your Railway environment variables.")

        sys.exit(1)

    # Step 2: Apply schema
    if not apply_schema():
        print("\n[ABORT] Schema deployment failed.")
        sys.exit(1)

    # Step 3: Seed data
    if not await seed_data():
        print("\n[ABORT] Data seeding failed.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  DEPLOYMENT COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Verify the deployment at /admin/prompts")
    print("2. Test the Anthropic provider connection")
    print("3. Review and update prompt content as needed")
    print("")


if __name__ == "__main__":
    asyncio.run(main())
