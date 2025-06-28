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
  color: z.string().describe('The suggested color for the LED lighting in hex format (e.g., #FF5733).'),
  intensity: z.number().describe('The suggested intensity for the LED lighting (0.0 to 1.0).'),
  effect: z.string().describe('The suggested lighting effect (e.g., "pulse", "strobe", "fade", or "static").'),
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
  prompt: `You are an AI assistant for a music-reactive LED system called Jaxi Taxi.
Your task is to analyze the mood, tempo, and energy of an audio track and suggest a synchronized lighting configuration.

Based on the provided audio data, determine the most fitting:
1.  **Color**: A single hex color code (e.g., '#FF00FF') that captures the song's primary emotion.
2.  **Intensity**: A value from 0.0 (dim) to 1.0 (bright) representing the song's energy level.
3.  **Effect**: One of the following lighting patterns: 'pulse', 'fade', 'strobe', or 'static'. Choose the effect that best matches the song's rhythm and tempo.

Consider the following current settings when making your determination, but prioritize the audio's characteristics: {{{currentSettings}}}

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
      
      const esp32Ip = process.env.ESP32_IP_ADDRESS;
      
      if (!esp32Ip) {
        console.warn("[Flow Warning] ESP32_IP_ADDRESS environment variable is not set. Skipping hardware command. The visualizer will still work.");
      } else {
        try {
          console.log(`[Flow] Sending command to ESP32 at ${esp32Ip}...`);
          const response = await fetch(`${esp32Ip}/set-leds`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(output),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Flow Error] Failed to send command to ESP32: ${response.status} ${response.statusText}`, errorText);
          } else {
            console.log('[Flow] Successfully sent command to ESP32.');
          }
        } catch (error) {
          console.error('[Flow Error] Network error sending request to ESP32. Is the device online and the IP correct?', error);
        }
      }
    }
    
    return output!;
  }
);
