'use server';
/**
 * @fileOverview This file defines the Genkit flow for the Sentinel agent, which continuously analyzes logs and metrics to detect anomalies.
 *
 * - detectAnomaly - A function that takes in logs and metrics data and returns a boolean indicating whether an anomaly is detected.
 * - DetectAnomalyInput - The input type for the detectAnomaly function, including logs and metrics.
 * - DetectAnomalyOutput - The return type for the detectAnomaly function, a boolean indicating anomaly detection.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomalyInputSchema = z.object({
  logs: z.string().describe('Logs data from the application.'),
  metrics: z.string().describe('Metrics data from the application, such as CPU usage, memory usage, and network traffic.'),
});
export type DetectAnomalyInput = z.infer<typeof DetectAnomalyInputSchema>;

const DetectAnomalyOutputSchema = z.object({
  isAnomaly: z.boolean().describe('Whether an anomaly is detected in the provided logs and metrics.'),
});
export type DetectAnomalyOutput = z.infer<typeof DetectAnomalyOutputSchema>;

export async function detectAnomaly(input: DetectAnomalyInput): Promise<DetectAnomalyOutput> {
  return detectAnomalyFlow(input);
}

const detectAnomalyPrompt = ai.definePrompt({
  name: 'detectAnomalyPrompt',
  input: {schema: DetectAnomalyInputSchema},
  output: {schema: DetectAnomalyOutputSchema},
  prompt: `You are the Sentinel agent, responsible for detecting anomalies in application logs and metrics.
  Analyze the provided logs and metrics data to determine if there are any unusual patterns or indicators of a potential incident.
  Return true if an anomaly is detected, and false otherwise.

  Logs:
  {{logs}}

  Metrics:
  {{metrics}}

  Consider factors such as error rates, latency, resource usage, and any other relevant information that might indicate a problem.
`,
  model: 'googleai/gemini-1.5-flash-latest',
});

const detectAnomalyFlow = ai.defineFlow(
  {
    name: 'detectAnomalyFlow',
    inputSchema: DetectAnomalyInputSchema,
    outputSchema: DetectAnomalyOutputSchema,
  },
  async input => {
    const {output} = await detectAnomalyPrompt(input);
    return output!;
  }
);
