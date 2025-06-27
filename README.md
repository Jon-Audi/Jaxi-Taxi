# Jaxi Taxi - Audio-Responsive LED Controller

This is a Next.js application that uses AI to analyze music and suggest synchronized lighting configurations for LED lights connected to a Raspberry Pi.

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

That's it! The script handles everything from the detailed guide below.

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
*   **Python 3 & Pip**: This is usually pre-installed on Raspberry Pi OS. Check with `python3 --version` and `pip3 --version`. If you need pip, install it:
    ```bash
    sudo apt-get update
    sudo apt-get install python3-pip
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

Now, install the necessary Node.js and Python packages.

1.  **Install Node.js packages:**
    ```bash
    npm install
    ```
2.  **Install Python packages for LED control:** This library requires root access for installation and execution.
    ```bash
    sudo pip3 install rpi_ws281x adafruit-circuitpython-neopixel
    ```

### Step 3: Hardware Setup (for WS2812B strip)

To control a WS2812B (or similar, like NeoPixel) addressable LED strip, you need to connect it to the Raspberry Pi's GPIO pins.

**⚠️ Power Warning:** LED strips can draw a lot of current. A long strip can easily damage your Raspberry Pi if powered directly from its 5V pin. **It is highly recommended to use a separate, dedicated 5V power supply** that can provide enough amperage for your strip (check your strip's specifications).

**Wiring:**

1.  **Connect Grounds:** The most important step is to connect the **Ground (GND)** pin from your external 5V power supply to a **GND pin on the Raspberry Pi** AND to the **GND wire on your LED strip**. This creates a common ground reference.
2.  **Connect Data:** Connect the **Data Input (DI or DIN)** wire of the LED strip to a PWM-capable GPIO pin on the Pi. **GPIO 18 (Pin 12)** is a common choice and is the default in the script.
3.  **Connect Power:** Connect the **5V** wire of your LED strip to the **positive (+)** terminal of your external 5V power supply. Do NOT connect this to the Pi's 5V pin unless you have a very short strip (fewer than 15-20 LEDs) and know what you're doing.

**Logic Level Shifter (Recommended):** Raspberry Pi GPIO pins operate at 3.3V, while WS2812B strips expect a 5V data signal. For short data wire runs it might work, but for reliability, it's best to use a logic level shifter to boost the signal from 3.3V to 5V.

### Step 4: Configure the LED Script

Before running, you might need to edit the Python script to match your hardware.

1. Open the script:
   ```bash
   nano src/scripts/control_leds.py
   ```
2.  Update the configuration variables at the top of the file:
    *   `LED_COUNT`: Change this to the number of LEDs on your strip.
    *   `LED_PIN`: Change this if you used a different GPIO pin than `board.D18`.
    *   `PIXEL_ORDER`: If your colors look wrong (e.g., red shows as green), try changing `"GRB"` to `"RGB"`.
3.  Press `Ctrl+X`, then `Y`, then `Enter` to save and exit.

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

### Step 6: Run the Application

Because the Python script needs to access hardware GPIO, it must be run with `sudo`. Therefore, you need to run the main Node.js application with `sudo` as well.

```bash
sudo npm run dev
```

The server will start, and you'll see some output in the terminal.

### Step 7: Access the Dashboard

From any other computer or phone on the same WiFi network, open a web browser and go to:

**http://192.168.4.219:9002**

You should see the Jaxi Taxi dashboard. Click play on a song. You should see output in your Pi's terminal from both the AI flow and the Python script, and your LED strip should light up!

## Bonus: Running on Boot (systemd)

To have this application start automatically when your Raspberry Pi boots, create a `systemd` service.

### 1. Create a Service File

```bash
sudo nano /etc/systemd/system/jaxi-taxi.service
```

### 2. Add the Service Configuration

Copy and paste the following content. We're setting `User=root` so the process has the necessary permissions to control the GPIO pins.

```ini
[Unit]
Description=Jaxi Taxi Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/jon/jaxi-taxi
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
*   **Tip:** To find the exact path to `npm`, you can run `which npm` in your terminal and replace `/usr/bin/npm` if it's different.

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

This will make your Raspberry Pi automatically launch the Jaxi Taxi dashboard in a full-screen browser when it boots up. Perfect for a dedicated device with a screen.

### 1. Ensure You're Booting to Desktop

This mode requires the Raspberry Pi to boot into the graphical desktop environment.
1.  Run `sudo raspi-config`.
2.  Navigate to `System Options` > `Boot / Auto Login`.
3.  Select `Desktop Autologin` (e.g., "B4 Desktop Autologin").
4.  Finish and reboot if necessary.

### 2. Install Unclutter

This small utility will hide the mouse cursor after a few seconds of inactivity, which is ideal for a touchscreen interface.

```bash
sudo apt-get update && sudo apt-get install unclutter -y
```

### 3. Create the Autostart File

We will create a special file that tells the desktop environment to launch our app.

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
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized http://localhost:9002
```

Save and exit by pressing `Ctrl+X`, then `Y`, and `Enter`.

### 5. Reboot

Now, reboot your Raspberry Pi:

```bash
sudo reboot
```

When your Pi starts up, it should automatically launch into the Jaxi Taxi dashboard in full-screen mode on your 7" display.

### How to Exit Kiosk Mode

If you need to get back to the desktop, you have two options:
*   **Keyboard:** Press `Alt` + `F4` to close the Chromium window.
*   **SSH:** Connect to your Pi via SSH from another computer and remove the autostart file:
    ```bash
    rm /home/jon/.config/autostart/jaxi-kiosk.desktop
    ```
    Then reboot.

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
# HEAD is your local commit, origin/main is the remote commit
if [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ]; then
    echo "Changes detected. Applying updates..."
    
    # This command forcefully resets your local main branch to match the one from GitHub.
    # It will overwrite any local code changes but will NOT delete untracked files
    # (like your music files in /public/audio, thanks to the .gitignore file).
    git reset --hard origin/main
    
    # Install/update Node.js packages if package.json has changed
    echo "Checking for new dependencies..."
    npm install
    
    # Restart the systemd service to apply all changes
    echo "Restarting Jaxi Taxi service..."
    sudo systemctl restart jaxi-taxi.service
    
    echo "Update complete."
else
    echo "No new changes from GitHub. Jaxi Taxi is up to date."
fi
```
Save and exit by pressing `Ctrl+X`, then `Y`, then `Enter`.

### 2. Make the Script Executable
You need to give the script permission to be executed.
```bash
chmod +x update.sh
```

### 3. Schedule the Script with Cron
`cron` is a utility that runs tasks on a schedule. We'll set it to run your update script every hour.

1.  Open the cron table for editing:
    ```bash
    crontab -e
    ```
2.  If it's your first time, you might be asked to choose an editor. Select `nano`.
3.  Add the following line to the bottom of the file:
    ```
    0 * * * * /home/jon/jaxi-taxi/update.sh >> /home/jon/jaxi-taxi/update.log 2>&1
    ```
    This line means: "At minute 0 of every hour, of every day, run the `update.sh` script. Send all output (both normal and errors) to an `update.log` file in the project directory."

Save and exit the file. Your Raspberry Pi will now automatically check for and apply updates every hour!

---

## Troubleshooting Git Update Errors

If you see an error like `The following untracked working tree files would be overwritten by merge` when running `git pull` or the `update.sh` script, it means Git is trying to protect files you've added locally (like your MP3s). Here's how to fix it:

1.  **Create a temporary backup of your music:**
    ```bash
    mv public/audio /tmp/audio_backup
    ```
2.  **Force the repository to reset to the latest version from GitHub:**
    ```bash
    git reset --hard origin/main
    ```
3.  **Pull the very latest changes (which now includes a rule to ignore your music files):**
    ```bash
    git pull origin main
    ```
4.  **Move your music back:**
    ```bash
    mv /tmp/audio_backup public/
    ```

After doing this once, the automatic `update.sh` script should work without this error in the future.
