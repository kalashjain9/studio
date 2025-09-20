'use server';

/**
 * @fileOverview An AI agent that analyzes a remediation plan and buggy code, then generates the corrected code.
 *
 * - engineerCommandExecution - A function that handles code correction.
 * - EngineerCommandExecutionInput - The input type for the engineerCommandExecution function.
 * - EngineerCommandExecutionOutput - The return type for the engineerCommandExecution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EngineerCommandExecutionInputSchema = z.object({
  remediationPlan: z
    .string()
    .describe('The remediation plan outlining the necessary code changes.'),
  codeToFix: z.string().describe('The actual block of buggy code to be fixed.'),
});
export type EngineerCommandExecutionInput = z.infer<typeof EngineerCommandExecutionInputSchema>;

const EngineerCommandExecutionOutputSchema = z.object({
  executionResult: z
    .string()
    .describe('The corrected code block with the fix applied.'),
});
export type EngineerCommandExecutionOutput = z.infer<typeof EngineerCommandExecutionOutputSchema>;

export async function engineerCommandExecution(
  input: EngineerCommandExecutionInput
): Promise<EngineerCommandExecutionOutput> {
  return engineerCommandExecutionFlow(input);
}

const commandTranslationPrompt = ai.definePrompt({
  name: 'commandTranslationPrompt',
  input: {schema: EngineerCommandExecutionInputSchema},
  output: {schema: z.object({executionResult: z.string().describe('The fixed code. Only output the code, no explanations.')})},
  prompt: `You are an expert software engineer. Your task is to fix a bug in a provided code snippet based on a remediation plan.
Analyze the plan and the buggy code, then return the complete, corrected code block.

Remediation Plan:
{{{remediationPlan}}}

Buggy Code:
\'\'\'
{{{codeToFix}}}
\'\'\'

Return only the fixed code, with no additional explanations or markdown formatting.`,
  model: 'googleai/gemini-1.5-flash-latest',
});

const engineerCommandExecutionFlow = ai.defineFlow(
  {
    name: 'engineerCommandExecutionFlow',
    inputSchema: EngineerCommandExecutionInputSchema,
    outputSchema: EngineerCommandExecutionOutputSchema,
  },
  async input => {
    const {output} = await commandTranslationPrompt(input);

    if (!output || !output.executionResult) {
      throw new Error('Failed to generate the fixed code.');
    }

    // The output from the prompt is the corrected code.
    return { executionResult: output.executionResult };
  }
);
