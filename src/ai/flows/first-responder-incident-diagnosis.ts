'use server';
/**
 * @fileOverview The First Responder agent (The Troubleshooter).
 *
 * - firstResponderIncidentDiagnosis - A function that handles the incident diagnosis process.
 * - FirstResponderIncidentDiagnosisInput - The input type for the firstResponderIncidentDiagnosis function.
 * - FirstResponderIncidentDiagnosisOutput - The return type for the firstResponderIncidentDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FirstResponderIncidentDiagnosisInputSchema = z.object({
  incidentReport: z.string().describe('The incident report from the Sentinel agent.'),
  sampleCode: z.string().describe('A sample of the potentially buggy code.').optional(),
});
export type FirstResponderIncidentDiagnosisInput = z.infer<typeof FirstResponderIncidentDiagnosisInputSchema>;

const FirstResponderIncidentDiagnosisOutputSchema = z.object({
  diagnosisReport: z.string().describe('The diagnosis report of the incident.'),
  deploymentName: z.string().describe('The name of the affected deployment.').optional(),
  namespace: z.string().describe('The Kubernetes namespace of the application.').optional(),
});
export type FirstResponderIncidentDiagnosisOutput = z.infer<typeof FirstResponderIncidentDiagnosisOutputSchema>;

export async function firstResponderIncidentDiagnosis(input: FirstResponderIncidentDiagnosisInput): Promise<FirstResponderIncidentDiagnosisOutput> {
  return firstResponderIncidentDiagnosisFlow(input);
}

// These tools are placeholders for a real environment.
// In a real SRE scenario, these would execute actual kubectl commands.
const getPodStatus = ai.defineTool({
  name: 'getPodStatus',
  description: 'Retrieves the status of the application pods.',
  inputSchema: z.object({
    namespace: z.string().describe('The Kubernetes namespace of the application.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  return `Pod status for namespace ${input.namespace}: All pods are running.`;
});

const getPodLogs = ai.defineTool({
  name: 'getPodLogs',
  description: 'Retrieves logs from a specific pod.',
  inputSchema: z.object({
    podName: z.string().describe('The name of the pod to retrieve logs from.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  return `Logs for pod ${input.podName}: No errors found.`;
});

const describeDeployment = ai.defineTool({
  name: 'describeDeployment',
  description: 'Retrieves the deployment history and details.',
  inputSchema: z.object({
    deploymentName: z.string().describe('The name of the deployment to describe.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  return `Deployment details for ${input.deploymentName}: No recent changes.`;
});

const prompt = ai.definePrompt({
  name: 'firstResponderIncidentDiagnosisPrompt',
  input: {schema: FirstResponderIncidentDiagnosisInputSchema},
  output: {schema: FirstResponderIncidentDiagnosisOutputSchema},
  tools: [getPodStatus, getPodLogs, describeDeployment],
  prompt: `You are the First Responder agent, a digital detective responsible for diagnosing incidents.
An incident has been detected. Your job is to determine the root cause.
Analyze the incident report, and if provided, the sample code.

Incident Report:
{{{incidentReport}}}

{{#if sampleCode}}
Potentially Buggy Code:
\'\'\'
{{{sampleCode}}}
\'\'\'
{{/if}}

Think step-by-step:
1.  Analyze the incident report and the code to form a hypothesis.
2.  If this seems like a code-level bug, clearly state the problem in the code.
3.  If this seems like an infrastructure issue, use your tools to investigate.
4.  Compile a concise diagnosis report summarizing your findings. If you identify a specific deployment or namespace from your tool use, include them. If not, you can omit them.
`,
  model: 'googleai/gemini-1.5-pro-latest',
});

const firstResponderIncidentDiagnosisFlow = ai.defineFlow(
  {
    name: 'firstResponderIncidentDiagnosisFlow',
    inputSchema: FirstResponderIncidentDiagnosisInputSchema,
    outputSchema: FirstResponderIncidentDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
