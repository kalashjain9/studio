'use server';

/**
 * @fileOverview An AI agent that translates a remediation plan into executable commands and executes them.
 *
 * - engineerCommandExecution - A function that handles the translation and execution of commands.
 * - EngineerCommandExecutionInput - The input type for the engineerCommandExecution function.
 * - EngineerCommandExecutionOutput - The return type for the engineerCommandExecution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {exec} from 'child_process';
import { promisify } from 'util';

const EngineerCommandExecutionInputSchema = z.object({
  remediationPlan: z
    .string()
    .describe('The remediation plan to be translated into executable commands.'),
});
export type EngineerCommandExecutionInput = z.infer<typeof EngineerCommandExecutionInputSchema>;

const EngineerCommandExecutionOutputSchema = z.object({
  executionResult: z
    .string()
    .describe('The result of executing the translated command.'),
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
  output: {schema: EngineerCommandExecutionOutputSchema},
  prompt: `You are an expert engineer specializing in translating remediation plans into executable commands.

You will receive a remediation plan and translate it into a single, precise command that can be executed in a terminal. Provide just the command, do not provide explanation.

Remediation Plan: {{{remediationPlan}}}`,
  model: 'gemini-1.5-flash-latest',
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
      throw new Error('Failed to translate remediation plan into a command.');
    }

    try {
      // Execute the command
      const { stdout, stderr } = await promisify(exec)(output.executionResult);

      // Capture the output and errors
      const executionResult = `Command executed successfully:\n${stdout}\n${stderr ? `Errors:\n${stderr}` : ''}`;

      return { executionResult };
    } catch (error: any) {
      console.error('Error executing command:', error);
      return {
        executionResult: `Command failed to execute:\n${error.message || error}`,
      };
    }
  }
);
