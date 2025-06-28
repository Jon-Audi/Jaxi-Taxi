'use server';
// VERSION: 6 - CORRECT EFFECT MAP & VARIETY PROMPT

/**
 * @fileOverview This file defines a Genkit flow for analyzing audio and determining corresponding LED lighting for WLED.
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
  currentSettings: z.string().describe('A JSON string of previous settings to encourage variety. The AI should try not to repeat effects.'),
});
export type AudioAnalysisLightingInput = z.infer<typeof AudioAnalysisLightingInputSchema>;

const AudioAnalysisLightingOutputSchema = z.object({
  primaryColor: z.string().describe("The primary suggested color for the LED lighting in hex format (e.g., '#FF5733'). This should be the dominant color."),
  secondaryColor: z.string().describe("A secondary, complementary or contrasting color to use in the effect, in hex format (e.g., '#33FF57')."),
  intensity: z.number().min(0).max(1.0).describe('The suggested overall brightness for the LED lighting (0.0 to 1.0).'),
  effect: z.string().describe('The suggested WLED lighting effect. You MUST choose one from the provided list that best matches the song\'s rhythm and energy.'),
  speed: z.number().min(0).max(255).describe('The speed of the lighting effect, from 0 (slowest) to 255 (fastest). Base this on the song\'s tempo.'),
  effectIntensity: z.number().min(0).max(255).describe('The intensity of the lighting effect itself, from 0 (subtle) to 255 (intense). Base this on the song\'s dynamic range or energy.'),
});
export type AudioAnalysisLightingOutput = z.infer<typeof AudioAnalysisLightingOutputSchema>;

export async function audioAnalysisLighting(
  input: AudioAnalysisLightingInput
): Promise<AudioAnalysisLightingOutput> {
  console.log('[Flow v6] Entering audioAnalysisLighting function.');
  return audioAnalysisLightingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'audioAnalysisLightingPrompt',
  input: {schema: AudioAnalysisLightingInputSchema},
  output: {schema: AudioAnalysisLightingOutputSchema},
  prompt: `You are an expert AI DJ controlling a 60-LED light strip for a system called Jaxi Taxi. Your job is to listen to a song and create a visually stunning, two-color light show using the WLED effects listed below.

CRITICAL INSTRUCTIONS:
1.  **BE CREATIVE AND VARIED:** The user has been seeing the same effects repeatedly. Your top priority is to use a WIDE VARIETY of effects from the list. Do not get stuck on one or two. The user's previous settings are provided; try to pick something different.
2.  **CHOOSE FROM THIS LIST ONLY:** You MUST choose an effect name exactly as it appears in the following list.
3.  **MATCH THE MOOD:** Your choice should reflect the song's energy, genre, and mood.

EFFECT LIST:
*   'Solid': A static, solid color. Best for intros, outros, or very calm, ambient songs.
*   'BPM': The classic choice for pop, rock, and most electronic music. Pulses colors to a clear, driving rhythm.
*   'Fireworks': Bursts of random colors. Perfect for high-energy moments, crescendos, or celebratory songs.
*   'Meteor': A streak of light with a fading trail. Excellent for songs with sweeping sounds, arpeggios, or a sense of motion.
*   'Lightning': Flashes of light. Use this sparingly for dramatic moments, intense breakdowns, or songs with a stormy feel.
*   'Rainbow': Smoothly cycles through all colors along the strip. A versatile, classic effect for upbeat and positive tracks.
*   'Chase Random': Colors chase each other down the strip, leaving a trail of random colors. Good for playful, energetic, or unpredictable music.
*   'Fire Flicker': Simulates a gentle, warm fire. Ideal for acoustic, folk, or intimate, warm-sounding tracks.
*   'Ripple': Creates a water-like ripple effect. Best for chill-out, lofi, or ambient tracks that have a liquid or flowing quality.
*   'Scan': A dot of light moving back and forth. A great fit for synth-heavy, retro, or futuristic-sounding music.
*   'Strobe': Classic high-energy flashing effect. Reserve this for intense dance music or powerful drops.

OUTPUT PARAMETERS:
-   **Primary Color**: The main hex color that captures the song's primary emotion.
-   **Secondary Color**: A second hex color that contrasts or complements the primary.
-   **Intensity**: Overall brightness from 0.0 (dim) to 1.0 (bright).
-   **Effect**: The name of the effect chosen from the list above.
-   **Speed**: From 0 (slow) to 255 (fast), based on the song's tempo.
-   **Effect Intensity**: From 0 (subtle) to 255 (intense), based on the song's energy. A powerful rock anthem should be high, a soft ballad should be low.

Current Settings (for variety): {{{currentSettings}}}
Audio for Analysis: {{media url=audioDataUri}}`,
});

const audioAnalysisLightingFlow = ai.defineFlow(
  {
    name: 'audioAnalysisLightingFlow',
    inputSchema: AudioAnalysisLightingInputSchema,
    outputSchema: AudioAnalysisLightingOutputSchema,
  },
  async input => {
    console.log('[Flow v6] Entered audioAnalysisLightingFlow. Calling AI prompt...');
    const {output} = await prompt(input);
    console.log('[Flow v6] Received output from AI.');
    
    if (output) {
      console.log(`[Flow v6] AI suggested lighting:`, output);
      
      const wledIp = process.env.ESP32_IP_ADDRESS;
      
      if (!wledIp) {
        console.warn("[Flow v6 Warning] ESP32_IP_ADDRESS is not set. Skipping hardware command.");
      } else {
        try {
          console.log('[Flow v6] Preparing to send command to WLED.');

          const hexToRgb = (hex: string): [number, number, number] => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
          };
          
          console.log('[Flow v6] Defining WLED effect map.');
          // Corrected map based on user-provided WLED documentation.
          const effectMap: { [key: string]: number } = {
            'solid': 0,
            'blink': 1,
            'breathe': 2,
            'wipe': 3,
            'wipe random': 4,
            'random colors': 5,
            'sweep': 6,
            'dynamic': 7,
            'colorloop': 8,
            'rainbow': 9,
            'scan': 10,
            'scan dual': 11,
            'fade': 12,
            'theater': 13,
            'theater rainbow': 14,
            'running': 15,
            'saw': 16,
            'twinkle': 17,
            'dissolve': 18,
            'dissolve rnd': 19,
            'sparkle': 20,
            'sparkle dark': 21,
            'sparkle+': 22,
            'strobe': 23,
            'strobe rainbow': 24,
            'strobe mega': 25,
            'blink rainbow': 26,
            'android': 27,
            'chase': 28,
            'chase random': 29,
            'chase rainbow': 30,
            'chase flash': 31,
            'chase flash rnd': 32,
            'rainbow runner': 33,
            'colorful': 34,
            'traffic light': 35,
            'sweep random': 36,
            'chase 2': 37,
            'aurora': 38,
            'stream': 39,
            'scanner': 40,
            'lighthouse': 41,
            'fireworks': 42,
            'rain': 43,
            'tetrix': 44,
            'fire flicker': 45,
            'gradient': 46,
            'loading': 47,
            'fairy': 49,
            'fairytwinkle': 51,
            'running dual': 52,
            'chase 3': 54,
            'tri wipe': 55,
            'tri fade': 56,
            'lightning': 57,
            'icu': 58,
            'multi comet': 59,
            'scanner dual': 60,
            'stream 2': 61,
            'oscillate': 62,
            'pride 2015': 63,
            'juggle': 64,
            'palette': 65,
            'fire 2012': 66,
            'colorwaves': 67,
            'bpm': 68,
            'fill noise': 69,
            'noise 1': 70,
            'noise 2': 71,
            'noise 3': 72,
            'noise 4': 73,
            'colortwinkles': 74,
            'lake': 75,
            'meteor': 76,
            'meteor smooth': 77,
            'railway': 78,
            'ripple': 79,
          };
          console.log('[Flow v6] Effect map defined.');

          const effectNameFromAI = (output.effect || 'solid').toLowerCase();
          console.log(`[Flow v6 Debug] AI effect name (lowercase): "${effectNameFromAI}"`);

          const effectId = effectMap[effectNameFromAI];
          console.log(`[Flow v6 Debug] Looked up effect ID from map: ${effectId}`);

          const finalEffectId = effectId === undefined ? 0 : effectId; // Default to Solid if lookup fails
          console.log(`[Flow v6 Debug] Final Mapped WLED Effect ID: ${finalEffectId}`);

          const wledPayload = {
            on: true,
            bri: Math.round((output.intensity || 0.8) * 255),
            seg: [{
              fx: finalEffectId,
              sx: output.speed || 128,
              ix: output.effectIntensity || 128,
              col: [
                hexToRgb(output.primaryColor || '#FFFFFF'), 
                hexToRgb(output.secondaryColor || '#000000'),
                [0,0,0]
              ]
            }]
          };

          console.log(`[Flow v6] Sending command to WLED at ${wledIp}...`);
          console.log(`[Flow v6] WLED Payload:`, JSON.stringify(wledPayload));

          const wledUrl = `${wledIp.replace(/\/$/, '')}/json/state`;
          
          const response = await fetch(wledUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wledPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Flow v6 Error] Failed to send command to WLED: ${response.status} ${response.statusText}`, errorText);
          } else {
            console.log('[Flow v6] Successfully sent command to WLED.');
          }
        } catch (error) {
          console.error('[Flow v6 Error] An error occurred while preparing or sending the WLED request.', error);
        }
      }
    } else {
        console.log('[Flow v6] AI did not return an output.');
    }
    
    return output!;
  }
);
