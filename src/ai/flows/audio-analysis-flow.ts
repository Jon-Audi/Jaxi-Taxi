'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing audio and determining corresponding LED lighting.
 *
 * - audioAnalysisLighting - A function that handles the audio analysis and lighting control process.
 * - AudioAnalysisLightingInput - The input type for the audioAnalysisLighting function.
 * - AudioAnalysisLightingOutput - The return type for the audioAnalysisLighting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { spawn } from 'child_process';

const AudioAnalysisLightingInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data URI, including MIME type and Base64 encoding (e.g., data:audio/mp3;base64,...).'
    ),
  currentSettings: z.string().describe('The current settings for the lighting system.'),
});
export type AudioAnalysisLightingInput = z.infer<typeof AudioAnalysisLightingInputSchema>;

const AudioAnalysisLightingOutputSchema = z.object({
  color: z.string().describe('The suggested color for the LED lighting.'),
  intensity: z.number().describe('The suggested intensity for the LED lighting (0-1).'),
  effect: z.string().describe('The suggested lighting effect (e.g., strobe, fade).'),
});
export type AudioAnalysisLightingOutput = z.infer<typeof AudioAnalysisLightingOutputSchema>;

export async function audioAnalysisLighting(
  input: AudioAnalysisLightingInput
): Promise<AudioAnalysisLightingOutput> {
  return audioAnalysisLightingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'audioAnalysisLightingPrompt',
  input: {schema: AudioAnalysisLightingInputSchema},
  output: {schema: AudioAnalysisLightingOutputSchema},
  prompt: `You are an AI tasked with analyzing audio characteristics and determining optimal LED lighting configurations to synchronize with the music.

Analyze the provided audio data and suggest a color, intensity, and effect for the LED lighting system.

Consider the following current settings when making your determination: {{{currentSettings}}}

Here is the audio data: {{media url=audioDataUri}}`,
});

const audioAnalysisLightingFlow = ai.defineFlow(
  {
    name: 'audioAnalysisLightingFlow',
    inputSchema: AudioAnalysisLightingInputSchema,
    outputSchema: AudioAnalysisLightingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (output) {
      console.log(`[Flow] AI suggested lighting:`, output);
      const pythonProcess = spawn('python3', [
        'src/scripts/control_leds.py',
        '--color',
        output.color,
        '--intensity',
        output.intensity.toString(),
        '--effect',
        output.effect,
      ]);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Error] ${data}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`[Python] Child process exited with code ${code}`);
      });
    }
    
    return output!;
  }
);
