'use server';

/**
 * @fileOverview This file defines the Genkit flow for the Commander agent, which formulates a remediation plan
 * based on the diagnostic report from the First Responder agent.
 *
 * - commanderRemediationPlanning - A function that initiates the remediation planning process.
 * - CommanderRemediationPlanningInput - The input type for the commanderRemediationPlanning function.
 * - CommanderRemediationPlanningOutput - The return type for the commanderRemediationPlanning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommanderRemediationPlanningInputSchema = z.object({
  diagnosticReport: z
    .string()
    .describe(
      'A detailed diagnostic report of the incident from the First Responder agent.'
    ),
  deploymentName: z.string().describe('The name of the affected deployment.'),
  namespace: z.string().describe('The Kubernetes namespace of the application.'),
});
export type CommanderRemediationPlanningInput = z.infer<
  typeof CommanderRemediationPlanningInputSchema
>;

const CommanderRemediationPlanningOutputSchema = z.object({
  remediationPlan: z
    .string()
    .describe(
      'A structured plan outlining the best course of action to remediate the incident, such as rolling back a deployment.'
    ),
});
export type CommanderRemediationPlanningOutput = z.infer<
  typeof CommanderRemediationPlanningOutputSchema
>;

export async function commanderRemediationPlanning(
  input: CommanderRemediationPlanningInput
): Promise<CommanderRemediationPlanningOutput> {
  return commanderRemediationPlanningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'commanderRemediationPlanningPrompt',
  input: {schema: CommanderRemediationPlanningInputSchema},
  output: {schema: CommanderRemediationPlanningOutputSchema},
  prompt: `You are the Commander, the team lead of an autonomous SRE team.
You receive a diagnostic report from the First Responder agent and decide on the best course of action to remediate the incident.

Based on your training and the context provided in this prompt, formulate a clear, structured plan.

Diagnostic Report:
{{{diagnosticReport}}}

The affected deployment is '{{{deploymentName}}}' in the '{{{namespace}}}' namespace.

What is the best course of action? Explain the decision and provide a clear, structured plan for remediation that includes the specific deployment and namespace.
`,
  model: 'googleai/gemini-1.5-pro-latest',
});

const commanderRemediationPlanningFlow = ai.defineFlow(
  {
    name: 'commanderRemediationPlanningFlow',
    inputSchema: CommanderRemediationPlanningInputSchema,
    outputSchema: CommanderRemediationPlanningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
