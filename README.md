# Jaxi Taxi - Audio-Responsive LED Controller

This is a Next.js application that uses AI to analyze music and suggest synchronized lighting configurations for LED lights connected to a Raspberry Pi.

## How It Works

1.  **Frontend (Next.js/React)**: A web-based dashboard allows you to play music and visualize the suggested lighting. It is built with ShadCN UI components and Tailwind CSS.
2.  **Backend (Next.js/Genkit)**: A Google Genkit flow analyzes the audio file using an AI model to determine an appropriate `color`, `intensity`, and `effect`.
3.  **Hardware Bridge (Python)**: The Genkit flow executes a Python script on the server (your Raspberry Pi), passing the lighting parameters as arguments.
4.  **GPIO Control (Python)**: The Python script interprets these arguments and (in a real setup) controls the GPIO pins to drive the connected LED lights.

---

## Raspberry Pi Setup Instructions

Follow these steps to get the project running on your Raspberry Pi.

### Prerequisites

*   A Raspberry Pi (3B+ or newer recommended) with Raspberry Pi OS.
*   Node.js and npm installed. You can install them with:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
*   Python 3 (usually comes pre-installed on Raspberry Pi OS).

### 1. Get the Code

Clone this repository or copy the files onto your Raspberry Pi.

### 2. Install Dependencies

Navigate to the project directory in your terminal and run:

```bash
npm install
```

This will install all the necessary Node.js packages.

### 3. (Optional) Install GPIO Library for Python

The included Python script `src/scripts/control_leds.py` is a placeholder. To make it control real LEDs, you'll need a Python GPIO library. `RPi.GPIO` is a common choice.

```bash
pip install RPi.GPIO
```

After installing, you will need to modify `src/scripts/control_leds.py` to use this library. The placeholder file contains comments showing where to add your hardware-specific code.

### 4. Run the Application

To run the application in development mode:

```bash
npm run dev
```

This will start the web server. You can access it from a web browser on your Raspberry Pi or another computer on the same network by navigating to `http://<YOUR_PI_IP_ADDRESS>:9002`.

### 5. See the Output

When you play a song in the web interface, the AI will analyze it. Check the terminal where you ran `npm run dev`. You will see output from the Python script, like this:

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

This confirms that the entire flow is working. The next step is to replace the `print` statements in `control_leds.py` with your actual GPIO logic!
