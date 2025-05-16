'use server';

/**
 * @fileOverview A flow for suggesting quiz topics to the user.
 *
 * - suggestTopic - A function that suggests a quiz topic.
 * - SuggestTopicInput - The input type for the suggestTopic function.
 * - SuggestTopicOutput - The return type for the suggestTopic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTopicInputSchema = z.object({
  userPreferences: z
    .string()
    .optional()
    .describe('Any specific preferences the user has for quiz topics.'),
});
export type SuggestTopicInput = z.infer<typeof SuggestTopicInputSchema>;

const SuggestTopicOutputSchema = z.object({
  suggestedTopics: z.array(
    z.string().describe('A suggested topic for a quiz, e.g., science, history, gaming, movies.')
  ).describe('A list of suggested quiz topics based on user preferences.'),
});
export type SuggestTopicOutput = z.infer<typeof SuggestTopicOutputSchema>;

export async function suggestTopic(input: SuggestTopicInput): Promise<SuggestTopicOutput> {
  return suggestTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTopicPrompt',
  input: {schema: SuggestTopicInputSchema},
  output: {schema: SuggestTopicOutputSchema},
  prompt: `You are a quiz topic suggestion expert.

  Based on the user's preferences, suggest a few topics for a quiz. The topics should be broad and engaging.

  User Preferences: {{userPreferences}}

  Suggest some quiz topics:`,
});

const suggestTopicFlow = ai.defineFlow(
  {
    name: 'suggestTopicFlow',
    inputSchema: SuggestTopicInputSchema,
    outputSchema: SuggestTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
