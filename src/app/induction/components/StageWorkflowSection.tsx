import {
  getOnboardingStageMetrics,
  getEmployeesInStage,
  type StageEmployee,
  type StageName,
} from "@/app/induction/queries";
import { StageWorkflowView } from "./StageWorkflowView";

const STAGES: StageName[] = ["Pre-Join", "Day 1", "Week 1", "Month 1", "Completed"];

export async function StageWorkflowSection() {
  const metrics = await getOnboardingStageMetrics();

  const stageLists = await Promise.all(
    STAGES.map(async (stage) => [stage, await getEmployeesInStage(stage)] as const),
  );

  const employeesByStage = Object.fromEntries(stageLists) as Record<
    StageName,
    StageEmployee[]
  >;

  return (
    <StageWorkflowView metrics={metrics} employeesByStage={employeesByStage} />
  );
}
