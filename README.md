# Jaxi Taxi - Audio-Responsive LED Controller

This is a Next.js application that uses AI to analyze music and suggest synchronized lighting configurations for LED lights connected to a Raspberry Pi.

## How It Works

1.  **Frontend (Next.js/React)**: A web-based dashboard allows you to play music and visualize the suggested lighting. It is built with ShadCN UI components and Tailwind CSS. The app dynamically finds and lists any MP3 files you place in the `public/audio` folder.
2.  **Backend (Next.js/Genkit)**: A Google Genkit flow analyzes the audio file using an AI model to determine an appropriate `color`, `intensity`, and `effect`.
3.  **Hardware Bridge (Python)**: The Genkit flow executes a Python script on the server (your Raspberry Pi), passing the lighting parameters as arguments.
4.  **GPIO Control (Python)**: The Python script interprets these arguments and (in a real setup) controls the GPIO pins to drive the connected LED lights.

---

## Step-by-Step Guide for Your Raspberry Pi

Absolutely! Here is a personalized guide to get Jaxi Taxi running on your Raspberry Pi at `192.168.4.219`.

### Prerequisites

Make sure your Raspberry Pi has the following installed:

*   **Git**: `sudo apt-get install git`
*   **Node.js & npm**: If not installed, run this command:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
*   **Python 3**: This is usually pre-installed on Raspberry Pi OS.

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

Now, install the necessary Node.js packages. This might take a few minutes on a Raspberry Pi.

```bash
npm install
```

### Step 3: Copy Your Music Files

You can copy any MP3 files from your music library directly into the project's `public/audio` folder. The application will automatically find and list them.

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

### Step 4: Run the Application

You're ready to start the server!

```bash
npm run dev
```

The server will start, and you'll see some output in the terminal.

### Step 5: Access the Dashboard

From any other computer or phone on the same WiFi network, open a web browser and go to:

**http://192.168.4.219:9002**

You should see the Jaxi Taxi dashboard. If you haven't added music, it will prompt you to. Otherwise, your playlist will appear.

### Step 6: Test the Lighting Control

Click play on a song in the dashboard. Watch the terminal on your Raspberry Pi where you ran `npm run dev`. You should see output from the Python script, like this:

```
[Flow] AI suggested lighting: { color: '#FF5733', intensity: 0.8, effect: 'pulse' }
[Python] GPIO_SETUP: Initializing GPIO pins.
[Python] GPIO_SETUP: Setup complete.
[Python] LED_CONTROL: Applying effect 'pulse'
[Python] LED_CONTROL: Setting color to RGB(255, 87, 51)
[Python] LED_CONTROL: Setting intensity to 80%
[Python] GPIO_CLEANUP: Releasing GPIO resources.
[Python] Child process exited with code 0
```

This confirms that the entire system is working!

### Next Step: Real Hardware (Optional)

To control actual LEDs, you'll need to:
1.  Install a Python GPIO library: `pip install RPi.GPIO`
2.  Modify `src/scripts/control_leds.py` to use your specific GPIO pin setup. The file contains comments showing where to add your hardware code.