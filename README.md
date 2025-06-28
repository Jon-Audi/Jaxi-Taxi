# Jaxi Taxi - Audio-Responsive LED Controller

This is a Next.js application that uses AI to analyze music and suggest synchronized lighting configurations for LED lights. It's designed to run on a Raspberry Pi and send commands over your WiFi network to an ESP32 running the WLED firmware.

## 🚀 Easy Installation (Recommended)

For a fresh Raspberry Pi setup, you can use the automated installation script. This will install all dependencies, set up the application to run on boot, and configure kiosk mode for a touchscreen.

1.  **Open a terminal on your Raspberry Pi.**
2.  **Download and run the setup script with one command:**

    ```bash
    bash <(curl -s https://raw.githubusercontent.com/Jon-Audi/Jaxi-Taxi/main/setup.sh)
    ```
    *Note: The script is pre-configured for your GitHub repository. If you move it, you'll need to update the URL inside the script.*

3.  **Follow the prompts.** The script will ask for your password to install software.
4.  **Reboot** when it's finished.

That's it! The script handles everything except the ESP32 setup below.

---

## 🛠️ Hardware Setup (WLED Method)

This setup uses an ESP32 microcontroller running the popular **WLED** firmware to handle all LED control. This is the recommended method as WLED is powerful, stable, and easy to configure. The Raspberry Pi will send lighting commands over your WiFi network to the ESP32.

**You will need:**
*   An ESP32 development board.
*   A WS2812B (NeoPixel) compatible LED strip.
*   A separate 5V power supply that can handle the current draw of your LED strip.

### Step 1: Install WLED on your ESP32

The easiest way to install WLED is through your browser.

1.  Connect your ESP32 to your computer via USB.
2.  Open a web browser (like Chrome or Edge) and go to **[install.wled.me](https://install.wled.me/)**.
3.  Follow the on-screen instructions to select your ESP32 and flash the latest version of WLED.

### Step 2: Configure WLED

1.  After flashing, WLED will create its own WiFi network. Connect to it with your phone or computer. A captive portal should pop up.
2.  In the portal, configure WLED to connect to **your home WiFi network**.
3.  Once it connects to your network, it will get an IP address. You can find this IP address in your router's device list or by using a network scanning tool.
4.  Navigate to this new IP address in your browser to access the WLED dashboard.
5.  Go to **Config > LED Preferences** and set the `GPIO` pin your LED strip is connected to (usually `GPIO 2`) and the `Length` (number of LEDs).
6.  Save your settings. Your lights should now be controllable from the WLED dashboard.

### Step 3: Wire your ESP32

**⚠️ Power Warning:** LED strips draw a lot of current. **Always use a separate, dedicated 5V power supply** that can provide enough amperage for your strip.

1.  **Connect Grounds:** Connect the **Ground (GND)** pin from your external 5V power supply to a **GND pin on the ESP32** AND to the **GND wire on your LED strip**. This is crucial.
2.  **Connect Data:** Connect the **Data Input (DI)** wire of the LED strip to the GPIO pin you configured in WLED (e.g., GPIO 2).
3.  **Connect Power:**
    *   Connect the **5V** wire of your LED strip to the **positive (+)** terminal of your external 5V power supply.
    *   Connect the **Vin** pin of the ESP32 to the same **positive (+)** terminal of your 5V power supply.

### Step 4: Configure the Jaxi Taxi App

The app needs to know your WLED device's IP address.

1.  On your Raspberry Pi, inside the `jaxi-taxi` directory, create a new file named `.env`:
    ```bash
    nano .env
    ```
2.  Add the following line to the file, replacing the IP with your WLED device's IP address.
    ```
    ESP32_IP_ADDRESS=http://192.168.1.123
    ```
3.  Save the file (`Ctrl+X`, `Y`, `Enter`).
4.  **Important**: Restart the Jaxi Taxi app to load this new configuration:
    ```bash
    sudo systemctl restart jaxi-taxi.service
    ```

### Step 5: Copy Your Music & Video Files

1.  **Music:** Place your MP3 files in the `public/audio/` directory.
    ```bash
    # From inside the jaxi-taxi project directory on your Pi
    mkdir -p public/audio
    cp /path/to/your/music/*.mp3 public/audio/
    ```
2.  **Video:** Place your background video file named `background.mp4` in the `public/videos/` directory.
    ```bash
    mkdir -p public/videos
    cp /path/to/your/video/background.mp4 public/videos/
    ```

---

## Troubleshooting

If things aren't working as expected, follow these steps in order.

### Problem: My code changes don't seem to be applying.
The app might be running an old, cached version. The setup script now clears this cache automatically, but if you update the code manually, you might need to do it yourself.
1. **Force a Clean Build:** On your Pi, navigate to the `jaxi-taxi` directory and run `rm -rf .next` to delete the cache. Then restart the app with `sudo systemctl restart jaxi-taxi.service`.
2. **Verify File Contents:** Make sure your changes were actually saved. You can view the contents of a file directly in the terminal. For example, to check the AI logic, run: `cat /home/jon/jaxi-taxi/src/ai/flows/audio-analysis-flow.ts`. The output should match the latest version of the code.

### Problem: Background is black, no video is playing.
1.  **File Name:** Make sure your video file is named exactly `background.mp4` and is located in the `jaxi-taxi/public/videos/` directory. Linux is case-sensitive!
2.  **File Format:** Some `.mp4` files use codecs that the Pi's browser can't play. Try re-encoding the video or using a different, known-good `.mp4` file to test.
3.  **Kiosk Mode:** Ensure you have rebooted the Pi after running the `setup.sh` script. The kiosk mode flags are essential for autoplay.

### Problem: Lights are not responding or are stuck on one pattern.
This is the most common issue and requires checking two things: the Pi's logs and the WLED device's status.

1.  **Check Pi Logs (Jaxi Taxi App):**
    *   On your Raspberry Pi, run `sudo journalctl -u jaxi-taxi.service -f`. This command shows the live logs of your application.
    *   When a song starts, you should see messages like this:
        ```
        [Flow] AI suggested lighting: { primaryColor: '#...', secondaryColor: '#...', ... }
        [Flow Debug] AI effect name (lowercase): "strobe"
        [Flow Debug] Mapped WLED Effect ID: 106
        [Flow] Sending command to WLED at http://...
        [Flow] WLED Payload: {"on":true,"bri":...,"seg":[{"fx":106,...}]}
        [Flow] Successfully sent command to WLED.
        ```
    *   **If you see `fx:5`**, it means the effect mapping failed and it's defaulting to "Random Colors". Ensure your `audio-analysis-flow.ts` file is up to date by re-running the setup script.
    *   **If you see a `FetchError` or `Failed to send command`**, it means the Pi cannot reach the WLED device. Continue to the next step.

2.  **Check WLED Manually:**
    *   Can you control your lights from the WLED web interface on your phone or computer? If not, the problem is with your WLED setup (WiFi, wiring, or LED preferences).
    *   In the WLED interface, go to **Info**. Does the `Signal Strength` look okay? Is the `Uptime` what you expect?

3.  **Verify the IP Address:**
    *   Double-check that the IP address in your `/home/jon/jaxi-taxi/.env` file is the correct one for your WLED device and includes the `http://` prefix.

4.  **Check Network Connectivity:**
    *   On the Raspberry Pi, try to `ping 192.168.X.X` (using your WLED IP and *without* the `http://`). If you get a response, the devices can see each other on the network. If not, there is a network issue (e.g., they are on different WiFi networks or a firewall is blocking them).
