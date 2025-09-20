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
});
export type FirstResponderIncidentDiagnosisInput = z.infer<typeof FirstResponderIncidentDiagnosisInputSchema>;

const FirstResponderIncidentDiagnosisOutputSchema = z.object({
  diagnosisReport: z.string().describe('The diagnosis report of the incident.'),
  deploymentName: z.string().describe('The name of the affected deployment.'),
  namespace: z.string().describe('The Kubernetes namespace of the application.'),
});
export type FirstResponderIncidentDiagnosisOutput = z.infer<typeof FirstResponderIncidentDiagnosisOutputSchema>;

export async function firstResponderIncidentDiagnosis(input: FirstResponderIncidentDiagnosisInput): Promise<FirstResponderIncidentDiagnosisOutput> {
  return firstResponderIncidentDiagnosisFlow(input);
}

const getPodStatus = ai.defineTool({
  name: 'getPodStatus',
  description: 'Retrieves the status of the application pods.',
  inputSchema: z.object({
    namespace: z.string().describe('The Kubernetes namespace of the application.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  // This is a placeholder implementation.
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
  // This is a placeholder implementation.
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
  // This is a placeholder implementation.
  return `Deployment details for ${input.deploymentName}: No recent changes.`;
});

const prompt = ai.definePrompt({
  name: 'firstResponderIncidentDiagnosisPrompt',
  input: {schema: FirstResponderIncidentDiagnosisInputSchema},
  output: {schema: FirstResponderIncidentDiagnosisOutputSchema},
  tools: [getPodStatus, getPodLogs, describeDeployment],
  prompt: `You are the First Responder agent, a digital detective responsible for diagnosing incidents in a Kubernetes environment.

  An incident has been detected, and you need to determine the root cause, the affected deployment name, and the namespace.
  You have access to tools to retrieve pod status, pod logs, and deployment details.
  Use these tools to investigate the incident. Assume the deployment name is 'my-app' and the namespace is 'production'.

  Here is the incident report from the Sentinel agent:
  {{incidentReport}}

  Think step by step.
  1.  Identify the namespace and deployment name.
  2.  Check the status of the application pods in that namespace.
  3.  If a pod is crashing, get the logs from that pod.
  4.  Check the deployment history for the identified deployment.
  5.  Finally, compile a diagnosis report summarizing your findings and output the deploymentName and namespace.
  Output must be a diagnosis report that concisely describes the root cause of the issue, along with the deploymentName and namespace.
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
