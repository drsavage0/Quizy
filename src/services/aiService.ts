
'use server';
// Note: Genkit flows are defined with 'use server' but are imported and called like regular functions.
// Next.js handles the server action transparently.

import { suggestTopic, type SuggestTopicInput, type SuggestTopicOutput } from "@/ai/flows/topic-suggestion";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { Difficulty } from "@/types";

export async function suggestTopics(input: SuggestTopicInput): Promise<SuggestTopicOutput> {
  try {
    return await suggestTopic(input);
  } catch (error) {
    console.error("Error suggesting topics:", error);
    throw new Error("Failed to suggest topics. Please try again.");
  }
}

export async function generateQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  try {
    // Ensure numQuestions is within the defined schema bounds
    // Difficulty is already validated by Zod schema in the flow
    const validatedInput = {
      ...input,
      numQuestions: Math.max(5, Math.min(20, input.numQuestions)),
    };
    return await generateQuizQuestions(validatedInput);
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error(`Failed to generate quiz questions for topic "${input.topic}" (difficulty: ${input.difficulty}). Please try again.`);
  }
}
