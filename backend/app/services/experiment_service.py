"""
Experiment Service
Manages A/B testing experiments for prompts
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from prisma import Prisma
from prisma.enums import ExperimentStatus
from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    """Schema for creating an experiment"""
    promptId: str
    name: str
    description: Optional[str] = None
    controlVersionId: str
    treatmentVersionId: str
    trafficSplit: float = 0.5  # 0.0-1.0, percentage going to treatment


class ExperimentUpdate(BaseModel):
    """Schema for updating an experiment"""
    name: Optional[str] = None
    description: Optional[str] = None
    trafficSplit: Optional[float] = None
    status: Optional[str] = None  # DRAFT, RUNNING, COMPLETED, CANCELLED


class ExperimentResponse(BaseModel):
    """Schema for experiment response"""
    id: str
    promptId: str
    promptSlug: Optional[str] = None
    name: str
    description: Optional[str]
    controlVersionId: str
    controlVersion: Optional[int] = None
    treatmentVersionId: str
    treatmentVersion: Optional[int] = None
    trafficSplit: float
    status: str
    startedAt: Optional[datetime]
    endedAt: Optional[datetime]
    controlInvocations: int
    treatmentInvocations: int
    controlAvgLatencyMs: Optional[float]
    treatmentAvgLatencyMs: Optional[float]
    controlAvgTokens: Optional[float]
    treatmentAvgTokens: Optional[float]
    controlErrorRate: Optional[float]
    treatmentErrorRate: Optional[float]
    createdAt: datetime
    updatedAt: datetime
    createdBy: str


class ExperimentResults(BaseModel):
    """Detailed results for an experiment"""
    experiment: ExperimentResponse
    controlMetrics: Dict[str, Any]
    treatmentMetrics: Dict[str, Any]
    recommendation: Optional[str] = None


class ExperimentService:
    """Manage A/B testing experiments for prompts"""

    def __init__(self):
        self.prisma = Prisma()

    async def connect(self):
        if not self.prisma.is_connected():
            await self.prisma.connect()

    async def disconnect(self):
        if self.prisma.is_connected():
            await self.prisma.disconnect()

    async def list_experiments(
        self,
        prompt_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[ExperimentResponse]:
        """List experiments, optionally filtered"""
        try:
            await self.connect()

            where: Dict[str, Any] = {}
            if prompt_id:
                where["promptId"] = prompt_id
            if status:
                where["status"] = ExperimentStatus(status)

            experiments = await self.prisma.promptexperiment.find_many(
                where=where,
                order={"createdAt": "desc"},
                include={
                    "prompt": True,
                    "controlVersion": True,
                    "treatmentVersion": True,
                }
            )

            return [
                ExperimentResponse(
                    id=e.id,
                    promptId=e.promptId,
                    promptSlug=e.prompt.slug if e.prompt else None,
                    name=e.name,
                    description=e.description,
                    controlVersionId=e.controlVersionId,
                    controlVersion=e.controlVersion.version if e.controlVersion else None,
                    treatmentVersionId=e.treatmentVersionId,
                    treatmentVersion=e.treatmentVersion.version if e.treatmentVersion else None,
                    trafficSplit=e.trafficSplit,
                    status=e.status.value if hasattr(e.status, 'value') else str(e.status),
                    startedAt=e.startedAt,
                    endedAt=e.endedAt,
                    controlInvocations=e.controlInvocations,
                    treatmentInvocations=e.treatmentInvocations,
                    controlAvgLatencyMs=e.controlAvgLatencyMs,
                    treatmentAvgLatencyMs=e.treatmentAvgLatencyMs,
                    controlAvgTokens=e.controlAvgTokens,
                    treatmentAvgTokens=e.treatmentAvgTokens,
                    controlErrorRate=e.controlErrorRate,
                    treatmentErrorRate=e.treatmentErrorRate,
                    createdAt=e.createdAt,
                    updatedAt=e.updatedAt,
                    createdBy=e.createdBy,
                )
                for e in experiments
            ]

        finally:
            await self.disconnect()

    async def get_experiment(self, experiment_id: str) -> Optional[ExperimentResponse]:
        """Get a single experiment by ID"""
        try:
            await self.connect()

            e = await self.prisma.promptexperiment.find_unique(
                where={"id": experiment_id},
                include={
                    "prompt": True,
                    "controlVersion": True,
                    "treatmentVersion": True,
                }
            )

            if not e:
                return None

            return ExperimentResponse(
                id=e.id,
                promptId=e.promptId,
                promptSlug=e.prompt.slug if e.prompt else None,
                name=e.name,
                description=e.description,
                controlVersionId=e.controlVersionId,
                controlVersion=e.controlVersion.version if e.controlVersion else None,
                treatmentVersionId=e.treatmentVersionId,
                treatmentVersion=e.treatmentVersion.version if e.treatmentVersion else None,
                trafficSplit=e.trafficSplit,
                status=e.status.value if hasattr(e.status, 'value') else str(e.status),
                startedAt=e.startedAt,
                endedAt=e.endedAt,
                controlInvocations=e.controlInvocations,
                treatmentInvocations=e.treatmentInvocations,
                controlAvgLatencyMs=e.controlAvgLatencyMs,
                treatmentAvgLatencyMs=e.treatmentAvgLatencyMs,
                controlAvgTokens=e.controlAvgTokens,
                treatmentAvgTokens=e.treatmentAvgTokens,
                controlErrorRate=e.controlErrorRate,
                treatmentErrorRate=e.treatmentErrorRate,
                createdAt=e.createdAt,
                updatedAt=e.updatedAt,
                createdBy=e.createdBy,
            )

        finally:
            await self.disconnect()

    async def create_experiment(
        self,
        data: ExperimentCreate,
        user_id: str
    ) -> ExperimentResponse:
        """Create a new experiment"""
        try:
            await self.connect()

            # Validate that both versions exist and belong to the same prompt
            control = await self.prisma.promptversion.find_unique(
                where={"id": data.controlVersionId}
            )
            treatment = await self.prisma.promptversion.find_unique(
                where={"id": data.treatmentVersionId}
            )

            if not control or not treatment:
                raise ValueError("Both control and treatment versions must exist")

            if control.promptId != data.promptId or treatment.promptId != data.promptId:
                raise ValueError("Both versions must belong to the specified prompt")

            # Check for existing running experiments on this prompt
            running = await self.prisma.promptexperiment.find_first(
                where={
                    "promptId": data.promptId,
                    "status": ExperimentStatus.RUNNING,
                }
            )

            if running:
                raise ValueError("An experiment is already running for this prompt. Stop it first.")

            e = await self.prisma.promptexperiment.create(
                data={
                    "promptId": data.promptId,
                    "name": data.name,
                    "description": data.description,
                    "controlVersionId": data.controlVersionId,
                    "treatmentVersionId": data.treatmentVersionId,
                    "trafficSplit": data.trafficSplit,
                    "status": ExperimentStatus.DRAFT,
                    "createdBy": user_id,
                },
                include={
                    "prompt": True,
                    "controlVersion": True,
                    "treatmentVersion": True,
                }
            )

            return ExperimentResponse(
                id=e.id,
                promptId=e.promptId,
                promptSlug=e.prompt.slug if e.prompt else None,
                name=e.name,
                description=e.description,
                controlVersionId=e.controlVersionId,
                controlVersion=e.controlVersion.version if e.controlVersion else None,
                treatmentVersionId=e.treatmentVersionId,
                treatmentVersion=e.treatmentVersion.version if e.treatmentVersion else None,
                trafficSplit=e.trafficSplit,
                status=e.status.value if hasattr(e.status, 'value') else str(e.status),
                startedAt=e.startedAt,
                endedAt=e.endedAt,
                controlInvocations=e.controlInvocations,
                treatmentInvocations=e.treatmentInvocations,
                controlAvgLatencyMs=e.controlAvgLatencyMs,
                treatmentAvgLatencyMs=e.treatmentAvgLatencyMs,
                controlAvgTokens=e.controlAvgTokens,
                treatmentAvgTokens=e.treatmentAvgTokens,
                controlErrorRate=e.controlErrorRate,
                treatmentErrorRate=e.treatmentErrorRate,
                createdAt=e.createdAt,
                updatedAt=e.updatedAt,
                createdBy=e.createdBy,
            )

        finally:
            await self.disconnect()

    async def update_experiment(
        self,
        experiment_id: str,
        data: ExperimentUpdate
    ) -> Optional[ExperimentResponse]:
        """Update an experiment"""
        try:
            await self.connect()

            update_data: Dict[str, Any] = {}

            if data.name is not None:
                update_data["name"] = data.name
            if data.description is not None:
                update_data["description"] = data.description
            if data.trafficSplit is not None:
                update_data["trafficSplit"] = data.trafficSplit

            if data.status is not None:
                new_status = ExperimentStatus(data.status)
                update_data["status"] = new_status

                # Set timestamps based on status changes
                if new_status == ExperimentStatus.RUNNING:
                    # Check for other running experiments
                    existing = await self.prisma.promptexperiment.find_unique(
                        where={"id": experiment_id}
                    )
                    if existing:
                        running = await self.prisma.promptexperiment.find_first(
                            where={
                                "promptId": existing.promptId,
                                "status": ExperimentStatus.RUNNING,
                                "NOT": {"id": experiment_id},
                            }
                        )
                        if running:
                            raise ValueError("Another experiment is already running for this prompt")

                    update_data["startedAt"] = datetime.utcnow()

                elif new_status in [ExperimentStatus.COMPLETED, ExperimentStatus.CANCELLED]:
                    update_data["endedAt"] = datetime.utcnow()

            if not update_data:
                return await self.get_experiment(experiment_id)

            await self.prisma.promptexperiment.update(
                where={"id": experiment_id},
                data=update_data
            )

            return await self.get_experiment(experiment_id)

        finally:
            await self.disconnect()

    async def start_experiment(self, experiment_id: str) -> Optional[ExperimentResponse]:
        """Start an experiment"""
        return await self.update_experiment(
            experiment_id,
            ExperimentUpdate(status="RUNNING")
        )

    async def stop_experiment(
        self,
        experiment_id: str,
        mark_completed: bool = True
    ) -> Optional[ExperimentResponse]:
        """Stop an experiment"""
        status = "COMPLETED" if mark_completed else "CANCELLED"
        return await self.update_experiment(
            experiment_id,
            ExperimentUpdate(status=status)
        )

    async def get_experiment_results(
        self,
        experiment_id: str
    ) -> Optional[ExperimentResults]:
        """Get detailed results for an experiment"""
        try:
            await self.connect()

            experiment = await self.get_experiment(experiment_id)
            if not experiment:
                return None

            # Get usage logs for this experiment
            control_logs = await self.prisma.promptusagelog.find_many(
                where={
                    "experimentId": experiment_id,
                    "versionId": experiment.controlVersionId,
                }
            )

            treatment_logs = await self.prisma.promptusagelog.find_many(
                where={
                    "experimentId": experiment_id,
                    "versionId": experiment.treatmentVersionId,
                }
            )

            # Calculate metrics
            def calculate_metrics(logs: list) -> Dict[str, Any]:
                if not logs:
                    return {
                        "invocations": 0,
                        "avgLatencyMs": None,
                        "avgTokens": None,
                        "errorRate": None,
                        "totalTokens": 0,
                    }

                total = len(logs)
                errors = sum(1 for log in logs if not log.success)
                total_latency = sum(log.latencyMs for log in logs)
                total_tokens = sum(log.totalTokens for log in logs)

                return {
                    "invocations": total,
                    "avgLatencyMs": total_latency / total if total > 0 else None,
                    "avgTokens": total_tokens / total if total > 0 else None,
                    "errorRate": errors / total if total > 0 else None,
                    "totalTokens": total_tokens,
                    "errors": errors,
                }

            control_metrics = calculate_metrics(control_logs)
            treatment_metrics = calculate_metrics(treatment_logs)

            # Update experiment with aggregated metrics
            await self.prisma.promptexperiment.update(
                where={"id": experiment_id},
                data={
                    "controlInvocations": control_metrics["invocations"],
                    "treatmentInvocations": treatment_metrics["invocations"],
                    "controlAvgLatencyMs": control_metrics["avgLatencyMs"],
                    "treatmentAvgLatencyMs": treatment_metrics["avgLatencyMs"],
                    "controlAvgTokens": control_metrics["avgTokens"],
                    "treatmentAvgTokens": treatment_metrics["avgTokens"],
                    "controlErrorRate": control_metrics["errorRate"],
                    "treatmentErrorRate": treatment_metrics["errorRate"],
                }
            )

            # Generate recommendation
            recommendation = self._generate_recommendation(
                control_metrics,
                treatment_metrics
            )

            # Refresh experiment data
            experiment = await self.get_experiment(experiment_id)

            return ExperimentResults(
                experiment=experiment,
                controlMetrics=control_metrics,
                treatmentMetrics=treatment_metrics,
                recommendation=recommendation,
            )

        finally:
            await self.disconnect()

    def _generate_recommendation(
        self,
        control: Dict[str, Any],
        treatment: Dict[str, Any]
    ) -> Optional[str]:
        """Generate a recommendation based on experiment results"""

        if control["invocations"] < 10 or treatment["invocations"] < 10:
            return "Insufficient data - need at least 10 invocations per variant for meaningful comparison"

        issues = []
        benefits = []

        # Compare error rates
        if control["errorRate"] and treatment["errorRate"]:
            error_diff = treatment["errorRate"] - control["errorRate"]
            if error_diff > 0.05:  # Treatment has 5%+ more errors
                issues.append(f"Treatment has {error_diff*100:.1f}% higher error rate")
            elif error_diff < -0.05:  # Treatment has 5%+ fewer errors
                benefits.append(f"Treatment has {abs(error_diff)*100:.1f}% lower error rate")

        # Compare latency
        if control["avgLatencyMs"] and treatment["avgLatencyMs"]:
            latency_ratio = treatment["avgLatencyMs"] / control["avgLatencyMs"]
            if latency_ratio > 1.2:  # 20% slower
                issues.append(f"Treatment is {(latency_ratio-1)*100:.0f}% slower")
            elif latency_ratio < 0.8:  # 20% faster
                benefits.append(f"Treatment is {(1-latency_ratio)*100:.0f}% faster")

        # Compare token usage (cost proxy)
        if control["avgTokens"] and treatment["avgTokens"]:
            token_ratio = treatment["avgTokens"] / control["avgTokens"]
            if token_ratio > 1.2:
                issues.append(f"Treatment uses {(token_ratio-1)*100:.0f}% more tokens")
            elif token_ratio < 0.8:
                benefits.append(f"Treatment uses {(1-token_ratio)*100:.0f}% fewer tokens")

        if not issues and not benefits:
            return "Results are similar - no significant difference between variants"

        if issues and not benefits:
            return f"Recommend staying with control. Issues with treatment: {'; '.join(issues)}"

        if benefits and not issues:
            return f"Recommend switching to treatment. Benefits: {'; '.join(benefits)}"

        return f"Mixed results. Benefits: {'; '.join(benefits)}. Concerns: {'; '.join(issues)}"

    async def delete_experiment(self, experiment_id: str) -> bool:
        """Delete an experiment (only if not running)"""
        try:
            await self.connect()

            experiment = await self.prisma.promptexperiment.find_unique(
                where={"id": experiment_id}
            )

            if not experiment:
                return False

            if experiment.status == ExperimentStatus.RUNNING:
                raise ValueError("Cannot delete a running experiment. Stop it first.")

            await self.prisma.promptexperiment.delete(
                where={"id": experiment_id}
            )

            return True

        finally:
            await self.disconnect()


def get_experiment_service() -> ExperimentService:
    """Get experiment service instance"""
    return ExperimentService()
