#!/usr/bin/env python3
"""
Database Purge Script
=====================
Deletes all data from the RevTrust database while preserving the schema.

Usage:
    poetry run python purge_database.py [--confirm] [--keep-users]

Options:
    --confirm      Skip the confirmation prompt
    --keep-users   Preserve user accounts (only delete analysis data)
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from prisma import Prisma


async def purge_database(keep_users: bool = False, skip_confirm: bool = False):
    """
    Purge all data from the database.

    Args:
        keep_users: If True, preserve user accounts
        skip_confirm: If True, skip confirmation prompt
    """
    db = Prisma()

    print("=" * 60)
    print("  RevTrust Database Purge Script")
    print("=" * 60)
    print()

    if keep_users:
        print("Mode: Purge analysis data only (keeping users)")
    else:
        print("Mode: FULL PURGE (all data will be deleted)")

    print()
    print("This will delete the following data:")
    print("  - All violations")
    print("  - All deals")
    print("  - All analyses")
    print("  - All review runs")
    print("  - All scheduled reviews")
    print("  - All output templates")
    print("  - All CRM connections")
    if not keep_users:
        print("  - All users")
    print()

    if not skip_confirm:
        confirm = input("Are you sure you want to continue? (type 'PURGE' to confirm): ")
        if confirm != "PURGE":
            print("Aborted.")
            return

    print()
    print("Connecting to database...")
    await db.connect()

    try:
        # Get counts before deletion
        print("Current database state:")

        user_count = await db.user.count()
        analysis_count = await db.analysis.count()
        deal_count = await db.deal.count()
        violation_count = await db.violation.count()
        crm_count = await db.crmconnection.count()
        scheduled_count = await db.scheduledreview.count()
        run_count = await db.reviewrun.count()
        template_count = await db.outputtemplate.count()

        print(f"  - Users: {user_count}")
        print(f"  - Analyses: {analysis_count}")
        print(f"  - Deals: {deal_count}")
        print(f"  - Violations: {violation_count}")
        print(f"  - CRM Connections: {crm_count}")
        print(f"  - Scheduled Reviews: {scheduled_count}")
        print(f"  - Review Runs: {run_count}")
        print(f"  - Output Templates: {template_count}")
        print()

        print("Purging data...")

        # Delete in order to respect foreign key constraints
        # 1. Delete violations (depends on deals)
        deleted = await db.violation.delete_many()
        print(f"  ✓ Deleted {deleted} violations")

        # 2. Delete deals (depends on analyses)
        deleted = await db.deal.delete_many()
        print(f"  ✓ Deleted {deleted} deals")

        # 3. Delete analyses (depends on users)
        deleted = await db.analysis.delete_many()
        print(f"  ✓ Deleted {deleted} analyses")

        # 4. Delete review runs (depends on scheduled reviews)
        deleted = await db.reviewrun.delete_many()
        print(f"  ✓ Deleted {deleted} review runs")

        # 5. Delete scheduled reviews (depends on users and CRM connections)
        deleted = await db.scheduledreview.delete_many()
        print(f"  ✓ Deleted {deleted} scheduled reviews")

        # 6. Delete output templates (depends on users)
        deleted = await db.outputtemplate.delete_many()
        print(f"  ✓ Deleted {deleted} output templates")

        # 7. Delete CRM connections (depends on users)
        deleted = await db.crmconnection.delete_many()
        print(f"  ✓ Deleted {deleted} CRM connections")

        # 8. Delete users (if not keeping)
        if not keep_users:
            deleted = await db.user.delete_many()
            print(f"  ✓ Deleted {deleted} users")
        else:
            print(f"  ⏭ Skipped users (--keep-users flag)")

        # 9. Delete business rules (optional - these are config)
        deleted = await db.businessrule.delete_many()
        print(f"  ✓ Deleted {deleted} business rules")

        # 10. Delete field mappings (optional - these are config)
        deleted = await db.fieldmapping.delete_many()
        print(f"  ✓ Deleted {deleted} field mappings")

        print()
        print("=" * 60)
        print("  Database purge complete!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during purge: {e}")
        raise
    finally:
        await db.disconnect()


def main():
    args = sys.argv[1:]

    keep_users = "--keep-users" in args
    skip_confirm = "--confirm" in args

    if "--help" in args or "-h" in args:
        print(__doc__)
        return

    asyncio.run(purge_database(keep_users=keep_users, skip_confirm=skip_confirm))


if __name__ == "__main__":
    main()
