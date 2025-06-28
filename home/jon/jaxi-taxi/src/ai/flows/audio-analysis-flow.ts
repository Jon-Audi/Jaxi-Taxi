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
  primaryColor: z.string().describe("The primary suggested color for the LED lighting in hex format (e.g., '#FF5733'). This should be the dominant color."),
  secondaryColor: z.string().describe("A secondary, complementary or contrasting color to use in the effect, in hex format (e.g., '#33FF57')."),
  intensity: z.number().describe('The suggested overall brightness for the LED lighting (0.0 to 1.0).'),
  effect: z.string().describe('The suggested WLED lighting effect. You MUST choose one from the provided list that best matches the song\'s rhythm and energy (e.g., "BPM", "Chase", "Fireworks", "Strobe", "Solid").'),
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
  prompt: `You are an AI DJ for a music-reactive LED system called Jaxi Taxi that controls WLED.
Your task is to analyze an audio track and suggest a dynamic, multi-colored lighting configuration.

Based on the provided audio, determine the following:
1.  **Primary Color**: The main hex color that captures the song's primary emotion.
2.  **Secondary Color**: A second hex color that contrasts or complements the primary, to be used in the effect.
3.  **Intensity**: Overall brightness from 0.0 (dim) to 1.0 (bright).
4.  **Effect**: Choose the *best* effect from this specific list. You MUST choose one:
    *   'Solid': A static, solid color. Use for intros, outros, or very calm songs.
    *   'BPM': Pulses colors to the beat. Great for pop, rock, and electronic music.
    *   'Chase': Colors chase each other down the strip.
    *   'Fireworks': Bursts of random colors. Perfect for high-energy moments or celebratory songs.
    *   'Strobe': A classic strobe effect. Use for high-energy dance or electronic tracks.
5.  **Speed**: A value from 0 (slow) to 255 (fast), based on the song's tempo.
6.  **Effect Intensity**: A value from 0 (subtle) to 255 (intense), based on the song's energy. A powerful rock anthem should be high, a soft ballad should be low.

Prioritize creating a dynamic, interesting two-color effect.

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

          // 1. Convert hex color to RGB array. This is now safer.
          const hexToRgb = (hex: string): [number, number, number] => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            // Return black if hex is invalid to prevent a crash.
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
          };

          // 2. Map our descriptive AI effect names to WLED's numeric effect IDs.
          // This list MUST match the list provided in the prompt.
          const effectMap: { [key: string]: number } = {
            'solid': 0,
            'bpm': 8,
            'chase': 45,  // Corresponds to 'Chase 2' in WLED
            'fireworks': 74,
            'strobe': 106,
            'lightning': 66
          };
          // Default to 'Solid' (0) if the AI returns an unexpected effect name.
          const effectId = effectMap[output.effect.toLowerCase()] || 0;

          // 3. Construct the WLED JSON payload.
          const wledPayload = {
            on: true,
            bri: Math.round(output.intensity * 255),
            seg: [{
              fx: effectId,
              sx: output.speed,
              ix: output.effectIntensity,
              col: [
                // Ensure we have valid colors even if the AI response is malformed.
                hexToRgb(output.primaryColor || '#000000'), 
                hexToRgb(output.secondaryColor || '#000000'),
                [0,0,0]
              ]
            }]
          };

          console.log(`[Flow] Sending command to WLED at ${wledIp}...`);
          console.log(`[Flow] WLED Payload:`, JSON.stringify(wledPayload));

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
          console.error('[Flow Error] An error occurred while preparing or sending the WLED request.', error);
        }
      }
    }
    
    return output!;
  }
);
