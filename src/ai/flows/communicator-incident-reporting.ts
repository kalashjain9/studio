'use server';
/**
 * @fileOverview A communicator AI agent that generates a summary report explaining the incident, diagnosis, and resolution in natural language.
 *
 * - communicatorIncidentReporting - A function that handles the incident reporting process.
 * - CommunicatorIncidentReportingInput - The input type for the communicatorIncidentReporting function.
 * - CommunicatorIncidentReportingOutput - The return type for the communicatorIncidentReporting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommunicatorIncidentReportingInputSchema = z.object({
  incidentDetection: z.string().describe('The initial detection of the incident.'),
  diagnosisReport: z.string().describe('The diagnostic report of the incident.'),
  remediationSteps: z.string().describe('The remediation steps taken to resolve the incident.'),
});
export type CommunicatorIncidentReportingInput = z.infer<typeof CommunicatorIncidentReportingInputSchema>;

const CommunicatorIncidentReportingOutputSchema = z.object({
  summaryReport: z.string().describe('A summary report explaining the incident, diagnosis, and resolution in natural language.'),
});
export type CommunicatorIncidentReportingOutput = z.infer<typeof CommunicatorIncidentReportingOutputSchema>;

export async function communicatorIncidentReporting(input: CommunicatorIncidentReportingInput): Promise<CommunicatorIncidentReportingOutput> {
  return communicatorIncidentReportingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'communicatorIncidentReportingPrompt',
  input: {schema: CommunicatorIncidentReportingInputSchema},
  output: {schema: CommunicatorIncidentReportingOutputSchema},
  prompt: `You are an AI agent that generates a summary report explaining the incident, diagnosis, and resolution in natural language.

  Here are the details of the incident:

  Incident Detection: {{{incidentDetection}}}
  Diagnosis Report: {{{diagnosisReport}}}
  Remediation Steps: {{{remediationSteps}}}

  Generate a concise and easy-to-understand summary report for human developers.
  `,
  model: 'googleai/gemini-1.5-flash',
});

const communicatorIncidentReportingFlow = ai.defineFlow(
  {
    name: 'communicatorIncidentReportingFlow',
    inputSchema: CommunicatorIncidentReportingInputSchema,
    outputSchema: CommunicatorIncidentReportingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
