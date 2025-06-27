
import argparse
import time
import board
from neopixel import NeoPixel
import math

# --- Configuration ---
# You will likely need to change these values to match your setup.
LED_COUNT = 50  # The number of LED pixels on your strip.
LED_PIN = board.D18  # GPIO pin connected to the pixels (must support PWM).
LED_BRIGHTNESS = 0.5 # Default brightness (0.0 to 1.0)
# For WS2812B, the pixel order is usually GRB.
# If your colors are swapped (e.g., red appears as green), change this to "RGB".
PIXEL_ORDER = "GRB" 
# --- End Configuration ---

# --- LED Helper Functions ---
def hex_to_rgb(hex_color):
    """Converts a hex color string to an (r, g, b) tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def apply_brightness(color, brightness):
    """Applies a brightness level to an RGB color tuple."""
    # Clamp brightness between 0 and 1
    brightness = max(0.0, min(1.0, brightness))
    return tuple(int(c * brightness) for c in color)

# --- Effect Implementations ---
# These effects are designed to be short-lived since this script is
# executed for each new AI suggestion.

def effect_static(strip, color, intensity):
    """Fills the entire strip with a static color."""
    final_color = apply_brightness(color, intensity)
    strip.fill(final_color)
    strip.show()
    # The script will exit, leaving the LEDs in this state until the next command.
    time.sleep(0.1) 

def effect_pulse(strip, color, intensity):
    """Creates a single smooth pulse effect over a short duration."""
    for i in range(100):
        # Create a sine wave for brightness fluctuation
        brightness_factor = (math.sin(i / 100.0 * math.pi))
        pulse_intensity = intensity * brightness_factor
        final_color = apply_brightness(color, pulse_intensity)
        strip.fill(final_color)
        strip.show()
        time.sleep(0.01)

def effect_strobe(strip, color, intensity):
    """Creates a few quick strobe flashes."""
    final_color = apply_brightness(color, intensity)
    off_color = (0, 0, 0)
    for _ in range(4):
        strip.fill(final_color)
        strip.show()
        time.sleep(0.05)
        strip.fill(off_color)
        strip.show()
        time.sleep(0.08)

def effect_fade(strip, color, intensity):
    """Fades the strip from black to the target color."""
    for i in range(50):
        fade_intensity = intensity * (i / 49.0)
        final_color = apply_brightness(color, fade_intensity)
        strip.fill(final_color)
        strip.show()
        time.sleep(0.02)

def main():
    parser = argparse.ArgumentParser(description="Control WS2812B LED lights.")
    parser.add_argument("--color", type=str, required=True, help="Hex color code (e.g., '#FF5733').")
    parser.add_argument("--intensity", type=float, required=True, help="Light intensity (0.0 to 1.0).")
    parser.add_argument("--effect", type=str, required=True, help="Lighting effect (e.g., 'pulse', 'strobe').")
    
    args = parser.parse_args()

    # Initialize the NeoPixel strip.
    # This requires root privileges to access GPIO.
    strip = None
    try:
        strip = NeoPixel(
            pin=LED_PIN,
            n=LED_COUNT,
            auto_write=False,
            brightness=LED_BRIGHTNESS,
            pixel_order=PIXEL_ORDER
        )
    except Exception as e:
        print(f"[Python Error] Error initializing NeoPixel strip: {e}", flush=True)
        print("[Python Error] This script must be run with 'sudo' to access GPIO.", flush=True)
        return

    rgb_color = hex_to_rgb(args.color)
    
    effects = {
        'static': effect_static,
        'pulse': effect_pulse,
        'strobe': effect_strobe,
        'fade': effect_fade
    }
    
    effect_func = effects.get(args.effect.lower())

    if effect_func:
        try:
            print(f"[Python] Applying effect '{args.effect}' with color '{args.color}'", flush=True)
            effect_func(strip, rgb_color, args.intensity)
            # Turn off lights after effect to be ready for the next command
            strip.fill((0,0,0))
            strip.show()
        except KeyboardInterrupt:
            print("[Python] Execution interrupted.", flush=True)
        finally:
            # Ensure pixels are off before exiting
            if strip:
                strip.fill((0,0,0))
                strip.show()
    else:
        print(f"[Python Error] Unknown effect: {args.effect}", flush=True)

if __name__ == "__main__":
    main()
