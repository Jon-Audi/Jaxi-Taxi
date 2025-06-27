#!/bin/bash

# This script automates the setup of the Jaxi Taxi application on a Raspberry Pi.
# It assumes it's being run by a user with sudo privileges.

# --- Configuration ---
# IMPORTANT: Make sure this URL points to YOUR GitHub repository!
REPO_URL="https://github.com/Jon-Audi/Jaxi-Taxi.git" 
APP_DIR="/home/jon/jaxi-taxi"
USER="jon"
# --- End Configuration ---

echo "--- Starting Jaxi Taxi Setup ---"

# --- Step 1: Install System Dependencies ---
echo "Updating package lists and installing dependencies (git, nodejs, python)..."
sudo apt-get update
sudo apt-get install -y git nodejs npm python3-pip unclutter

# Install Node.js v20 if not present or version is too old
# (This is more robust than the simple apt-get install)
if ! command -v node >/dev/null || [[ $(node -v | cut -d'.' -f1) != "v20" ]]; then
    echo "Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi


# --- Step 2: Clone the Repository ---
if [ -d "$APP_DIR" ]; then
    echo "Application directory already exists. Skipping clone."
else
    echo "Cloning repository into $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone repository. Please check the REPO_URL in this script."
        exit 1
    fi
fi

cd "$APP_DIR" || exit

# --- Step 3: Install Project Dependencies ---
echo "Installing Node.js packages..."
npm install

echo "Installing Python packages for LED control..."
sudo pip3 install rpi_ws281x adafruit-circuitpython-neopixel


# --- Step 4: Create Music and Video Directories ---
echo "Creating directories for your media..."
mkdir -p public/audio
mkdir -p public/videos

# --- Step 5: Set up systemd Service (Run on Boot) ---
echo "Creating systemd service to run the app on boot..."

SYSTEMD_SERVICE_FILE="/etc/systemd/system/jaxi-taxi.service"

sudo bash -c "cat > $SYSTEMD_SERVICE_FILE" << EOL
[Unit]
Description=Jaxi Taxi Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

echo "Enabling and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable jaxi-taxi.service
sudo systemctl start jaxi-taxi.service


# --- Step 6: Set up Kiosk Mode (Autostart GUI) ---
echo "Setting up Kiosk Mode for the touchscreen..."

KIOSK_AUTOSTART_DIR="/home/$USER/.config/autostart"
KIOSK_DESKTOP_FILE="$KIOSK_AUTOSTART_DIR/jaxi-kiosk.desktop"

mkdir -p "$KIOSK_AUTOSTART_DIR"

cat > "$KIOSK_DESKTOP_FILE" << EOL
[Desktop Entry]
Type=Application
Name=Jaxi Taxi Kiosk
Comment=Launches Jaxi Taxi in Kiosk Mode
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized http://localhost:9002
EOL

# Ensure the user owns the autostart configuration
sudo chown -R $USER:$USER "/home/$USER/.config"


# --- Final Instructions ---
echo ""
echo "--- Setup Complete! ---"
echo ""
echo "The application is now running and will start automatically on boot."
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Add your MP3 files to: $APP_DIR/public/audio/"
echo "2. Add your background video as: $APP_DIR/public/videos/background.mp4"
echo "3. If you haven't already, REBOOT your Pi to ensure kiosk mode starts correctly: sudo reboot"
echo ""
echo "You can access the dashboard from another device at: http://$(hostname -I | awk '{print $1'}):9002"
echo ""
