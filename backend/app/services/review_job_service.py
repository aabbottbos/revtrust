"""
Service to execute scheduled pipeline reviews
"""

from typing import Dict, List
from datetime import datetime
from prisma import Prisma
from app.services.salesforce_service import get_salesforce_service
from app.services.hubspot_service import get_hubspot_service
from app.services.ai_service import get_ai_service
from app.utils.business_rules_engine import BusinessRulesEngine
import traceback


class ReviewJobService:
    """Execute scheduled pipeline review jobs"""

    def __init__(self):
        self.rules_engine = BusinessRulesEngine()
        self.ai_service = get_ai_service()

    async def execute_review(
        self,
        scheduled_review_id: str,
        run_id: str
    ) -> Dict:
        """Execute a scheduled pipeline review"""

        prisma = Prisma()
        await prisma.connect()

        try:
            # Update run status
            await prisma.reviewrun.update(
                where={"id": run_id},
                data={"status": "running"}
            )

            # Get scheduled review config
            scheduled_review = await prisma.scheduledreview.find_unique(
                where={"id": scheduled_review_id},
                include={
                    "crmConnection": True,
                    "user": True
                }
            )

            if not scheduled_review:
                raise Exception("Scheduled review not found")

            connection = scheduled_review.crmConnection
            user = scheduled_review.user

            print(f"📊 Starting review: {scheduled_review.name}")
            print(f"   User: {user.email}")
            print(f"   CRM: {connection.provider}")

            # Step 1: Fetch deals from CRM
            print("🔄 Fetching deals from CRM...")
            deals = await self._fetch_deals_from_crm(connection)

            if not deals or len(deals) == 0:
                raise Exception("No deals found in CRM")

            print(f"✓ Fetched {len(deals)} deals")

            # Step 2: Run business rules analysis
            print("🔍 Running business rules analysis...")
            analysis_result = self.rules_engine.analyze_deals(deals)

            health_score = int(analysis_result["health_score"])
            violations = analysis_result["violations"]

            print(f"✓ Analysis complete - Health Score: {health_score}/100")
            print(f"✓ Found {len(violations)} issues")

            # Group violations by deal ID
            violations_by_deal = {}
            for violation in violations:
                deal_id = violation.get("deal_id", "")
                if deal_id:
                    if deal_id not in violations_by_deal:
                        violations_by_deal[deal_id] = []
                    violations_by_deal[deal_id].append(violation)

            # Step 2.5: Run AI analysis on deals
            print("🤖 Running AI analysis on deals...")
            ai_results = await self.ai_service.analyze_pipeline(deals, violations_by_deal)
            print(f"✓ AI analysis complete - Analyzed {len(ai_results)} deals")

            # Step 2.6: Generate pipeline summary
            print("📊 Generating pipeline summary...")
            pipeline_summary = await self.ai_service.generate_pipeline_summary(deals, ai_results)
            print(f"✓ Pipeline summary generated - Health: {pipeline_summary.get('overall_health', 'unknown')}")

            # Step 3: Store results
            print("💾 Storing results...")

            # Count high risk deals
            high_risk_count = sum(1 for v in violations if v.get("severity") == "CRITICAL")

            # Update review run with results
            await prisma.reviewrun.update(
                where={"id": run_id},
                data={
                    "status": "completed",
                    "completedAt": datetime.now(),
                    "dealsAnalyzed": len(deals),
                    "healthScore": health_score,
                    "issuesFound": len(violations),
                    "highRiskDeals": high_risk_count
                }
            )

            # Update scheduled review last run time
            await prisma.scheduledreview.update(
                where={"id": scheduled_review_id},
                data={"lastRunAt": datetime.now()}
            )

            print("✅ Review completed successfully!")

            # Step 4: Deliver results (if delivery channels configured)
            if scheduled_review.deliveryChannels:
                print("📧 Delivering results...")
                try:
                    from app.services.delivery_service import get_delivery_service

                    delivery_service = get_delivery_service()

                    # Create a lookup dictionary for deal amounts
                    deal_amounts = {d.get("id"): d.get("amount", 0) for d in deals}

                    # Convert AI results to dict format for delivery
                    ai_results_dict = [
                        {
                            "deal_id": r.deal_id,
                            "deal_name": r.deal_name,
                            "deal_amount": deal_amounts.get(r.deal_id, 0),
                            "risk_level": r.risk_level,
                            "risk_score": r.risk_score,
                            "risk_factors": r.risk_factors,
                            "next_best_action": r.next_best_action,
                            "action_priority": r.action_priority,
                            "action_rationale": r.action_rationale,
                            "executive_summary": r.executive_summary
                        }
                        for r in ai_results
                    ]

                    await delivery_service.deliver_review_results(
                        scheduled_review_id=scheduled_review_id,
                        analysis_id=run_id,  # Using run_id as placeholder
                        review_data={
                            "health_score": health_score,
                            "deals_analyzed": len(deals),
                            "ai_results": {
                                "pipeline_summary": pipeline_summary,
                                "results": ai_results_dict
                            }
                        }
                    )

                    print("✅ Results delivered successfully!")

                except Exception as e:
                    print(f"⚠️ Delivery failed: {e}")
                    traceback.print_exc()
                    # Continue - don't fail the job if delivery fails

            return {
                "status": "success",
                "run_id": run_id,
                "deals_analyzed": len(deals),
                "health_score": health_score,
                "issues_found": len(violations)
            }

        except Exception as e:
            print(f"❌ Review failed: {e}")
            traceback.print_exc()

            # Update run status to failed
            await prisma.reviewrun.update(
                where={"id": run_id},
                data={
                    "status": "failed",
                    "completedAt": datetime.now(),
                    "errorMessage": str(e)
                }
            )

            raise

        finally:
            await prisma.disconnect()

    async def _fetch_deals_from_crm(self, connection) -> List[Dict]:
        """Fetch deals from the connected CRM"""

        if connection.provider == "salesforce":
            sf_service = get_salesforce_service()
            return await sf_service.fetch_opportunities(connection.id)

        elif connection.provider == "hubspot":
            hs_service = get_hubspot_service()
            return await hs_service.fetch_deals(connection.id)

        else:
            raise Exception(f"Unknown CRM provider: {connection.provider}")


def get_review_job_service() -> ReviewJobService:
    """Get review job service instance"""
    return ReviewJobService()
