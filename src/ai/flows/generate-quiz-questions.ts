
'use server';

/**
 * @fileOverview Generates quiz questions based on a selected topic and difficulty.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Difficulty } from '@/types';

const DifficultyEnum = z.enum(["easy", "smart", "master"]);

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate quiz questions.'),
  numQuestions: z
    .number()
    .min(5)
    .max(20)
    .describe('The number of quiz questions to generate (between 5 and 20).'),
  difficulty: DifficultyEnum.describe('The difficulty level of the quiz questions (easy, smart, master).'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  answers: z.array(z.string()).length(4).describe('Four multiple-choice answers.'),
  correctAnswerIndex: z
    .number()
    .min(0)
    .max(3)
    .describe('The index (0-3) of the correct answer in the answers array.'),
});

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz question generator. Generate {{numQuestions}} quiz questions about {{topic}} at a {{difficulty}} difficulty level.
For 'easy' difficulty, questions should be straightforward and cover basic concepts.
For 'smart' (medium) difficulty, questions should require more understanding and may involve some nuanced details.
For 'master' (hard) difficulty, questions should be challenging, potentially covering obscure facts or requiring deeper analysis.

For each question, provide four multiple-choice answers, with one correct answer. Indicate the index of the correct answer (0-3). Return the result in JSON format.

Example:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "answers": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctAnswerIndex": 2
    },
    {
      "question": "What is 2 + 2?",
      "answers": ["3", "4", "5", "6"],
      "correctAnswerIndex": 1
    }
  ]
}

Now generate {{numQuestions}} questions about {{topic}} with {{difficulty}} difficulty:
`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
