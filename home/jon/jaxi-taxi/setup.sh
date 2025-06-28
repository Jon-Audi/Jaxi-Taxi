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
echo "Updating package lists and installing dependencies (git, nodejs, unclutter)..."
sudo apt-get update
# DO NOT install 'npm' via apt, as the 'nodejs' package from NodeSource includes it, and installing it separately causes conflicts.
sudo apt-get install -y git nodejs unclutter

# Install Node.js v20 if not present or version is too old
# (This is a more robust check and installation method)
if ! command -v node >/dev/null || [[ $(node -v | cut -d'.' -f1) != "v20" ]]; then
    echo "Installing Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi


# --- Step 2: Clone or Update the Repository ---
if [ -d "$APP_DIR" ]; then
    echo "Application directory already exists. Updating to the latest version..."
    cd "$APP_DIR"
    # Ensure the user owns the directory to avoid git permission errors
    sudo chown -R $USER:$USER "$APP_DIR"
    
    echo "Fetching latest changes from GitHub..."
    git fetch origin main
    
    # Reset the local repository to match the remote version.
    # This will overwrite any local changes to tracked files. Your .env file will be preserved.
    echo "Applying updates..."
    git reset --hard origin/main

    echo "Force-cleaning the directory to remove old files..."
    git clean -dfx

else
    echo "Cloning repository into $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone repository. Please check the REPO_URL in this script."
        exit 1
    fi
    # Set ownership immediately after cloning.
    sudo chown -R $USER:$USER "$APP_DIR"
fi

cd "$APP_DIR" || exit

# --- Step 3: AGGRESSIVE CACHE CLEANING & Dependency Installation ---
echo "--- Starting Aggressive Clean and Rebuild ---"
echo "Removing old build artifacts and dependencies..."
rm -f package-lock.json
rm -rf node_modules
rm -rf .next

echo "Clearing npm cache..."
npm cache clean --force

echo "Re-installing Node.js packages from scratch..."
npm install

echo "Building application for production..."
npm run build


# --- Step 4: Create Media Directories ---
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
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
EnvironmentFile=$APP_DIR/.env
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

echo "Enabling and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable jaxi-taxi.service
sudo systemctl restart jaxi-taxi.service


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
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized --autoplay-policy=no-user-gesture-required --ignore-gpu-blacklist --enable-gpu-rasterization http://localhost:9002
EOL

# Ensure the user owns the autostart configuration
sudo chown -R $USER:$USER "/home/$USER/.config"


# --- Final Instructions ---
echo ""
echo "--- Setup Complete! ---"
echo ""
echo "The application is now running and will start automatically on boot."
echo "If this was a re-run, services were restarted with the latest code after an aggressive cache clean."
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Create the .env file if your app needs it (e.g., for the ESP32 IP address)."
echo "2. Add your MP3 files to: $APP_DIR/public/audio/"
echo "3. Add your background video as: $APP_DIR/public/videos/background.mp4"
echo "4. If you haven't already, REBOOT your Pi to ensure kiosk mode starts correctly: sudo reboot"
echo ""
echo "You can access the dashboard from another device at: http://$(hostname -I | awk '{print $1'}):9002"
echo ""
