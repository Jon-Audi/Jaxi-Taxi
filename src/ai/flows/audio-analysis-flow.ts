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
  intensity: z.number().describe('The suggested overall brightness for the LED lighting (0.0 to 1.0).'),
  effect: z.string().describe('The suggested lighting effect (e.g., "pulse", "strobe", "fade", or "static").'),
  speed: z.number().min(0).max(255).describe('The speed of the lighting effect, from 0 (slowest) to 255 (fastest). Base this on the song\'s tempo.'),
  effectIntensity: z.number().min(0).max(255).describe('The intensity of the lighting effect itself, from 0 (subtle) to 255 (intense). Base this on the song\'s dynamic range or energy.'),
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
Your task is to analyze the mood, tempo, and energy of an audio track and suggest a synchronized lighting configuration for a device running WLED.

Based on the provided audio data, determine the most fitting:
1.  **Color**: A single hex color code (e.g., '#FF00FF') that captures the song's primary emotion.
2.  **Intensity**: A value from 0.0 (dim) to 1.0 (bright) representing the song's overall brightness.
3.  **Effect**: One of the following lighting patterns: 'pulse', 'fade', 'strobe', or 'static'. Choose the effect that best matches the song's rhythm and tempo.
4.  **Speed**: A value from 0 (very slow) to 255 (very fast) for the chosen effect. A fast tempo song should have a high speed, and a slow ballad should have a low speed.
5.  **Effect Intensity**: A value from 0 (subtle) to 255 (very intense) for the effect. A high-energy song (e.g., rock anthem) should have a high intensity, while a calm ambient track should have a lower intensity.

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
      
      const wledIp = process.env.ESP32_IP_ADDRESS;
      
      if (!wledIp) {
        console.warn("[Flow Warning] ESP32_IP_ADDRESS (for WLED) environment variable is not set. Skipping hardware command. The visualizer will still work.");
      } else {
        try {
          // --- WLED Integration Logic ---

          // 1. Convert hex color to RGB array
          const hexToRgb = (hex: string): [number, number, number] => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
          };

          // 2. Map AI effect names to WLED effect IDs
          const effectMap: { [key: string]: number } = {
            'static': 0,
            'strobe': 5,
            'fade': 4,
            'pulse': 8, // Mapping 'pulse' to WLED's 'BPM' effect
          };
          const effectId = effectMap[output.effect.toLowerCase()] || 0; // Default to 'Static'

          // 3. Construct the WLED JSON payload
          const wledPayload = {
            on: true,
            bri: Math.round(output.intensity * 255), // Convert intensity (0-1.0) to brightness (0-255)
            seg: [{
              col: [hexToRgb(output.color)],
              fx: effectId,
              sx: output.speed,
              ix: output.effectIntensity
            }]
          };

          console.log(`[Flow] Sending command to WLED at ${wledIp}...`);
          console.log(`[Flow] WLED Payload:`, JSON.stringify(wledPayload));

          // The WLED API endpoint is /json/state
          const wledUrl = `${wledIp.replace(/\/$/, '')}/json/state`;
          
          const response = await fetch(wledUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(wledPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Flow Error] Failed to send command to WLED: ${response.status} ${response.statusText}`, errorText);
          } else {
            console.log('[Flow] Successfully sent command to WLED.');
          }
        } catch (error) {
          console.error('[Flow Error] Network error sending request to WLED. Is the device online and the IP correct?', error);
        }
      }
    }
    
    return output!;
  }
);
