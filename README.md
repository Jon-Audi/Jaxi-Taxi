# Jaxi Taxi - Audio-Responsive LED Controller

This is a Next.js application that uses AI to analyze music and suggest synchronized lighting configurations for LED lights. It's designed to run on a Raspberry Pi and send commands to a separate microcontroller (like an ESP32) that controls the lights.

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

## 🛠️ Step-by-Step Manual Guide

This guide contains the detailed manual steps for installing and configuring the application. The easy installation script above automates this process.

### Prerequisites

Make sure your Raspberry Pi has the following installed:

*   **Git**: `sudo apt-get install git`
*   **Node.js & npm**: If not installed, run this command:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

### Step 1: Get the Code on Your Pi

First, you'll need to get the project files onto your Raspberry Pi. The easiest way is to push it to a GitHub repository and then clone it on the Pi.

1.  **On your main computer**, push the project to GitHub (if you haven't already).
2.  **On your Raspberry Pi**, open a terminal and run the following command to clone the repository. Replace `<YOUR_GITHUB_REPO_URL>` with the actual URL.
    ```bash
    git clone <YOUR_GITHUB_REPO_URL> jaxi-taxi
    ```
3.  Navigate into the new project directory:
    ```bash
    cd jaxi-taxi
    ```

### Step 2: Install Project Dependencies

Now, install the necessary Node.js packages.
```bash
npm install
```

### Step 3: Hardware Setup (ESP32 Method)

This setup uses an ESP32 microcontroller to handle the LED control. This is more robust and flexible than controlling LEDs directly from the Pi's GPIO pins. The Raspberry Pi will send lighting commands over your WiFi network to the ESP32.

**You will need:**
*   An ESP32 development board.
*   A WS2812B (NeoPixel) LED strip.
*   A separate 5V power supply for the LED strip.
*   The Arduino IDE or VS Code with the PlatformIO extension to program the ESP32.

#### 1. Wiring your ESP32

**⚠️ Power Warning:** LED strips can draw a lot of current. **It is highly recommended to use a separate, dedicated 5V power supply** that can provide enough amperage for your strip.

1.  **Connect Grounds:** Connect the **Ground (GND)** pin from your external 5V power supply to a **GND pin on the ESP32** AND to the **GND wire on your LED strip**. This creates a common ground reference.
2.  **Connect Data:** Connect the **Data Input (DI)** wire of the LED strip to a GPIO pin on the ESP32. **GPIO 2** is a common choice.
3.  **Connect Power:**
    *   Connect the **5V** wire of your LED strip to the **positive (+)** terminal of your external 5V power supply.
    *   Connect the **Vin** pin of the ESP32 to the same **positive (+)** terminal of your 5V power supply to power the board.

#### 2. Programming your ESP32

You need to upload code to your ESP32. You can use the Arduino IDE for this.

**A. Install Libraries in Arduino IDE:**
Go to `Sketch` > `Include Library` > `Manage Libraries...` and install the following:
*   `Adafruit NeoPixel`
*   `ArduinoJson`

**B. The Code:**
Open a new sketch in the Arduino IDE and paste the code below. **Remember to change the `ssid`, `password`, `LED_PIN`, and `LED_COUNT` variables to match your setup.**

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>

// --- WiFi and LED Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define LED_PIN    2  // GPIO pin connected to the LED strip's Data In
#define LED_COUNT 60  // Number of LEDs on your strip
// --- End Configuration ---

WebServer server(80);
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Define server routes
  server.on("/set-leds", HTTP_POST, handleSetLeds);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}

// --- Route Handlers ---
void handleSetLeds() {
  Serial.println("\n--- New Request Received ---");

  if (server.hasArg("plain") == false) {
    Serial.println("[ERROR] Request has no body.");
    server.send(400, "text/plain", "Body not received");
    return;
  }
  
  String body = server.arg("plain");
  Serial.print("Request Body: ");
  Serial.println(body);
  
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    Serial.print("[ERROR] deserializeJson() failed: ");
    Serial.println(error.c_str());
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  // Extract data from JSON
  const char* color_hex = doc["color"]; // "#RRGGBB"
  float intensity = doc["intensity"];  // 0.0 to 1.0
  const char* effect = doc["effect"];  // "pulse", "fade", etc.

  Serial.printf("Parsed Data -> Color: %s, Intensity: %.2f, Effect: %s\n", color_hex, intensity, effect);

  // Convert hex color to RGB
  long number = strtol(&color_hex[1], NULL, 16);
  int r = number >> 16;
  int g = (number >> 8) & 0xFF;
  int b = number & 0xFF;

  Serial.printf("Converted RGB -> R: %d, G: %d, B: %d\n", r, g, b);

  // Apply the effect
  applyEffect(r, g, b, intensity, effect);

  server.send(200, "application/json", "{\"status\":\"ok\"}");
  Serial.println("--- Request Handled Successfully ---");
}

void handleNotFound(){
  server.send(404, "text/plain", "Not found");
}

// --- LED Effect Functions ---
void applyEffect(int r, int g, int b, float intensity, const char* effect) {
  // Apply the master intensity to the color
  uint32_t finalColor = strip.Color(r * intensity, g * intensity, b * intensity);

  // A simple router for effects
  if (strcmp(effect, "fade") == 0) {
    effect_fade(finalColor);
  } else if (strcmp(effect, "pulse") == 0) {
    effect_pulse(r, g, b, intensity);
  } else if (strcmp(effect, "strobe") == 0) {
    effect_strobe(finalColor);
  } else { // Default to static
    effect_static(finalColor);
  }
}

void effect_static(uint32_t color) {
  strip.fill(color);
  strip.show();
}

void effect_fade(uint32_t color) {
    // Fade in over 50 steps
    for(int i = 0; i < 50; i++) {
        uint32_t c = Adafruit_NeoPixel::gamma32(strip.ColorHSV(strip.getPixelColor(0), 255, i * (255/49)));
        strip.fill(color);
        strip.show();
        delay(15);
    }
    strip.fill(color);
    strip.show();
}

void effect_pulse(int r, int g, int b, float intensity) {
    for (int i = 0; i < 255; i++) {
        float brightness = (sin(i * 3.14159 / 255.0));
        uint32_t pulseColor = strip.Color(r * intensity * brightness, g * intensity * brightness, b * intensity * brightness);
        strip.fill(pulseColor);
        strip.show();
        delay(3);
    }
    // Leave the light on at the final color
    uint32_t finalColor = strip.Color(r * intensity, g * intensity, b * intensity);
    strip.fill(finalColor);
    strip.show();
}

void effect_strobe(uint32_t color) {
    for(int i=0; i<4; i++) {
        strip.fill(color);
        strip.show();
        delay(50);
        strip.fill(strip.Color(0,0,0));
        strip.show();
        delay(80);
    }
    // Leave the light on at the final color
    strip.fill(color);
    strip.show();
}
```

**C. Upload and Get IP:**
1.  Connect your ESP32 to your computer.
2.  In Arduino IDE, select the correct board (e.g., "ESP32 Dev Module") and Port.
3.  Click "Upload".
4.  Once it's done, open the Serial Monitor (`Tools` > `Serial Monitor`) and set the baud rate to `115200`. Reset your ESP32, and you should see it connect to WiFi and print its IP address. **Copy this IP address.**

### Step 4: Configure the Jaxi Taxi App

The app needs to know your ESP32's IP address.

1.  On your Raspberry Pi, inside the `jaxi-taxi` directory, create a new file named `.env`:
    ```bash
    nano .env
    ```
2.  Add the following line to the file, replacing the IP with the one you copied from your ESP32's serial monitor.
    ```
    ESP32_IP_ADDRESS=http://192.168.1.123
    ```
3.  Save the file (`Ctrl+X`, `Y`, `Enter`).
4.  **Important**: If the Jaxi Taxi app is already running, you must restart it to load this new configuration. If you set it up as a service, run:
    ```bash
    sudo systemctl restart jaxi-taxi.service
    ```

### Step 5: Copy Your Music Files

The app needs your MP3 files to be in the `public/audio/` directory.

Run this command from inside the `jaxi-taxi` project directory on your Pi to copy all MP3s from your music folder:

```bash
# This command creates the 'public/audio' directory if it doesn't exist
mkdir -p public/audio

# Now, copy your music into it
cp /home/jon/media/music/*.mp3 public/audio/
```

If your music is in subdirectories, you can use a command like this to find and copy them all:
```bash
find /home/jon/media/music -type f -name "*.mp3" -exec cp -t public/audio/ {} +
```
**Note**: After copying the files, you may need to restart the application or refresh the browser to see your updated playlist.

### Step 6: Build and Run the Application

If you haven't set up the `systemd` service, you can run the app manually. For the best performance, you should build the optimized version first.

1.  **Build the app:**
    ```bash
    npm run build
    ```
2.  **Start the app:**
    ```bash
    npm run start
    ```

### Step 7: Access the Dashboard

From any other computer or phone on the same WiFi network, open a web browser and go to your Raspberry Pi's address:

**http://192.168.4.219:9002**

When you play a song, the app will now send a command to your ESP32, and your lights should react!

---
*The rest of the README content (Running on Boot, Kiosk Mode, Auto Updates, Troubleshooting) remains the same.*
---

## Bonus: Running on Boot (systemd)

To have this application start automatically when your Raspberry Pi boots, create a `systemd` service.

### 1. Create a Service File

```bash
sudo nano /etc/systemd/system/jaxi-taxi.service
```

### 2. Add the Service Configuration

Copy and paste the following content.

```ini
[Unit]
Description=Jaxi Taxi Application
After=network.target

[Service]
Type=simple
User=jon
WorkingDirectory=/home/jon/jaxi-taxi
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
EnvironmentFile=/home/jon/jaxi-taxi/.env

[Install]
WantedBy=multi-user.target
```
*   **Note:** We changed `ExecStart` to `npm run start` for better performance and added `EnvironmentFile` to ensure your `.env` variables are loaded by the service.

Press `Ctrl+X` to exit, `Y` to save the changes, and `Enter` to confirm the filename.

### 3. Enable and Start the Service

Now, tell `systemd` to recognize the new service and start it:

```bash
# Reload systemd to read the new service file
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable jaxi-taxi.service

# Start the service immediately
sudo systemctl start jaxi-taxi.service
```

That's it! The application will now start automatically every time you boot your Raspberry Pi.

### 4. Useful Service Commands

*   **Check the status:** `sudo systemctl status jaxi-taxi.service`
*   **View the logs:** `sudo journalctl -u jaxi-taxi.service -f`
*   **Stop the service:** `sudo systemctl stop jaxi-taxi.service`
*   **Restart the service:** `sudo systemctl restart jaxi-taxi.service`

## Bonus: Kiosk Mode for the 7" Touchscreen

This will make your Raspberry Pi automatically launch the Jaxi Taxi dashboard in a full-screen browser when it boots up.

### 1. Ensure You're Booting to Desktop

1.  Run `sudo raspi-config`.
2.  Navigate to `System Options` > `Boot / Auto Login`.
3.  Select `Desktop Autologin` (e.g., "B4 Desktop Autologin").
4.  Finish and reboot if necessary.

### 2. Install Unclutter

```bash
sudo apt-get update && sudo apt-get install unclutter -y
```

### 3. Create the Autostart File

1.  First, make sure the autostart directory exists for your user:
    ```bash
    mkdir -p /home/jon/.config/autostart
    ```
2.  Now, create a new file inside it:
    ```bash
    nano /home/jon/.config/autostart/jaxi-kiosk.desktop
    ```

### 4. Add the Kiosk Configuration

Copy and paste the following content into the `nano` editor:

```ini
[Desktop Entry]
Type=Application
Name=Jaxi Taxi Kiosk
Comment=Launches Jaxi Taxi in Kiosk Mode
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized --autoplay-policy=no-user-gesture-required --ignore-gpu-blacklist --enable-gpu-rasterization http://localhost:9002
```

Save and exit by pressing `Ctrl+X`, then `Y`, and `Enter`.

### 5. Reboot

Now, reboot your Raspberry Pi: `sudo reboot`. When it starts up, it should automatically launch into the Jaxi Taxi dashboard in full-screen mode.

## Bonus: Automatic Updates from GitHub

To keep your Raspberry Pi application up-to-date with the latest changes from your GitHub repository, you can set up a script that runs automatically.

### 1. Create an Update Script

First, create a script that will pull the latest code and restart the app.

```bash
# From your project directory /home/jon/jaxi-taxi
nano update.sh
```

Paste the following into the `update.sh` file:
```bash
#!/bin/bash

# Navigate to your project directory
cd /home/jon/jaxi-taxi || exit

# Fetch the latest changes from the remote repository
echo "Fetching latest updates from GitHub..."
git fetch origin

# Check if there are any changes
if [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ]; then
    echo "Changes detected. Applying updates..."
    
    # Stash local changes (like package-lock.json), pull, then pop
    git stash
    git pull origin main --rebase
    git stash pop
    
    echo "Checking for new dependencies..."
    npm install

    echo "Building application for production..."
    npm run build
    
    echo "Restarting Jaxi Taxi service..."
    sudo systemctl restart jaxi-taxi.service
    
    echo "Update complete."
else
    echo "No new changes from GitHub. Jaxi Taxi is up to date."
fi
```
Save and exit.

### 2. Make the Script Executable
```bash
chmod +x update.sh
```

### 3. Schedule the Script with Cron
1.  Open the cron table for editing: `crontab -e`
2.  Add the following line to the bottom of the file:
    ```
    0 * * * * /home/jon/jaxi-taxi/update.sh >> /home/jon/jaxi-taxi/update.log 2>&1
    ```
Save and exit. Your Raspberry Pi will now automatically check for and apply updates every hour.

---

## Troubleshooting

### `git pull` fails with `untracked working tree files` error

This happens when you've added local files (like your MP3s) that Git isn't tracking, and an incoming update might conflict with them.

**How to Fix:**
1.  **Temporarily move your audio files:**
    ```bash
    # From your /home/jon/jaxi-taxi directory
    mkdir ../temp_audio
    mv public/audio/*.mp3 ../temp_audio/
    ```
2.  **Clean your Git repository:**
    ```bash
    git clean -fd
    ```
3.  **Pull the latest updates:**
    ```bash
    git pull origin main
    ```
4.  **Move your audio files back:**
    ```bash
    mv ../temp_audio/*.mp3 public/audio/
    rm -rf ../temp_audio
    ```
5.  **Restart the service** to pick up the new code:
    ```bash
    sudo systemctl restart jaxi-taxi.service
    ```
This should resolve the error. The new `.gitignore` file will prevent this from happening again with your music files.

### ESP32 Troubleshooting

If your lights aren't responding, follow these steps:

1.  **Check the ESP32 Serial Monitor:**
    *   Connect the ESP32 to your computer and open the Arduino IDE.
    *   Open the Serial Monitor (top-right icon) and set the baud rate to `115200`.
    *   Reset the ESP32. You should see it connect to your WiFi and print its IP address. If not, double-check your WiFi credentials in the code.
    *   When a song plays in Jaxi Taxi, the monitor should print `--- New Request Received ---` along with the JSON data. If you don't see this, the Pi is not reaching the ESP32.

2.  **Verify the IP Address:**
    *   Make sure the IP address in the ESP32's Serial Monitor is the *exact same* one you put in the `/home/jon/jaxi-taxi/.env` file on your Raspberry Pi (including the `http://` prefix).

3.  **Check Pi Logs:**
    *   On your Raspberry Pi, run `sudo journalctl -u jaxi-taxi.service -f`.
    *   When a song plays, you should see a log message like `[Flow] Sending command to ESP32 at http://...`.
    *   If you see a network error, it confirms the Pi cannot connect to the ESP32.

4.  **Confirm Network Connectivity:**
    *   On the Raspberry Pi, try to `ping <ESP32_IP_ADDRESS>` (without the `http://`). If you get a response, the devices can see each other on the network. If not, there is a network issue (e.g., they are on different WiFi networks or a firewall is blocking them).
