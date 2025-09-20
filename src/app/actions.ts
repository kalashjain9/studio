'use server';

import { detectAnomaly } from '@/ai/flows/sentinel-anomaly-detection';
import type { DetectAnomalyInput } from '@/ai/flows/sentinel-anomaly-detection';
import { firstResponderIncidentDiagnosis } from '@/ai/flows/first-responder-incident-diagnosis';
import type { FirstResponderIncidentDiagnosisInput } from '@/ai/flows/first-responder-incident-diagnosis';
import { commanderRemediationPlanning } from '@/ai/flows/commander-remediation-planning';
import type { CommanderRemediationPlanningInput } from '@/ai/flows/commander-remediation-planning';
import { engineerCommandExecution } from '@/ai/flows/engineer-command-execution';
import type { EngineerCommandExecutionInput } from '@/ai/flows/engineer-command-execution';
import { communicatorIncidentReporting } from '@/ai/flows/communicator-incident-reporting';
import type { CommunicatorIncidentReportingInput } from '@/ai/flows/communicator-incident-reporting';

export async function runDetectAnomaly(input: DetectAnomalyInput) {
  return await detectAnomaly(input);
}

export async function runFirstResponderIncidentDiagnosis(input: FirstResponderIncidentDiagnosisInput) {
  return await firstResponderIncidentDiagnosis(input);
}

export async function runCommanderRemediationPlanning(input: CommanderRemediationPlanningInput) {
  return await commanderRemediationPlanning(input);
}

export async function runEngineerCommandExecution(input: EngineerCommandExecutionInput) {
  return await engineerCommandExecution(input);
}

export async function runCommunicatorIncidentReporting(input: CommunicatorIncidentReportingInput) {
  return await communicatorIncidentReporting(input);
}
