'use server';

import fs from 'fs/promises';
import path from 'path';
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
import { AgentName } from '@/components/agent-icons';

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

const agentFlowFiles: Record<AgentName, string> = {
    "Sentinel": "sentinel-anomaly-detection.ts",
    "First Responder": "first-responder-incident-diagnosis.ts",
    "Commander": "commander-remediation-planning.ts",
    "Engineer": "engineer-command-execution.ts",
    "Communicator": "communicator-incident-reporting.ts",
    "System": "",
};

export async function updateAgentModel(agentName: AgentName, model: string) {
    const fileName = agentFlowFiles[agentName];
    if (!fileName) {
        throw new Error(`Invalid agent name: ${agentName}`);
    }

    const filePath = path.join(process.cwd(), 'src', 'ai', 'flows', fileName);

    try {
        let fileContent = await fs.readFile(filePath, 'utf-8');
        
        const modelRegex = /model: 'googleai\/([^']*)'/;
        if (modelRegex.test(fileContent)) {
            fileContent = fileContent.replace(modelRegex, `model: '${model}'`);
            await fs.writeFile(filePath, fileContent, 'utf-8');
            return { success: true };
        } else {
            // Fallback for different model definition syntax
            const modelRegex2 = /model: '([^']*)'/;
             if (modelRegex2.test(fileContent)) {
                fileContent = fileContent.replace(modelRegex2, `model: '${model}'`);
                await fs.writeFile(filePath, fileContent, 'utf-8');
                return { success: true };
            }
        }
        
        return { success: false, error: 'Model definition not found in file.' };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}