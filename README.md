<div text= "2xl" align="center">

🚀 AIVORA DESK

The Ultimate Hybrid Automation Platform

Safe. Secure. Centralized. The future of X (Twitter) automation is here.

Features • Architecture • Installation • Usage • Troubleshooting

</div>

🌟 Overview

Aivora Desk is a sophisticated Hybrid Automation System designed to solve the biggest problem in web scraping: IP Blocking & Detection.

By decoupling the Control Plane (Next.js) from the Execution Plane (Local Python Worker), Aivora Desk allows you to manage massive automation tasks from a beautiful web dashboard while executing them safely from your residential IP address.

✨ Features

🛡️ Anti-Detection Architecture

Hybrid Execution: Commands come from the cloud; actions happen locally.

Residential IP Usage: Uses your home network to bypass X's data center blocklists.

Human-Like Behavior: Randomized delays (4-10s) and natural scrolling patterns.

🧠 Smart Automation Core

Force Click Technology: Bypasses overlays, popups, and intercepted clicks using JS injection.

Auto-Resume: Remembers where it left off. If interrupted, it picks up the next job seamlessly.

Headless & Visual Modes: Runs visibly for login (First Run), then vanishes into the background.

💻 Modern Control Dashboard

Drag & Drop Interface: Upload Excel/CSV files instantly.

Real-Time Terminal: Watch logs stream live from your local worker to the web UI.

Live Progress Tracking: Visual progress bars and status indicators (PENDING → RUNNING → COMPLETED).

🏗️ Architecture

Aivora Desk operates on a Client-Server-Worker model:

Frontend (Next.js 14): The user uploads a job file. The file is converted to Base64 and stored in the server's memory.

API Layer (Node.js): Exposes endpoints (/create, /pending, /status) for communication.

Worker (Python): Polls the API, downloads the job, launches Chrome via Selenium, and reports back status.

🚀 Installation & Setup

Prerequisites

Node.js (v18+)

Python (v3.10+)

Google Chrome installed

Step 1: Dashboard Setup (The Brain)

# 1. Install Dependencies
npm install

# 2. Start the Development Server
npm run dev


The dashboard is now live at http://localhost:3000. Keep this terminal running!

Step 2: Worker Setup (The Muscle)

Open a new terminal window for the Python worker.

# 1. Install Python Libraries
pip install pandas selenium chromedriver-autoinstaller requests openpyxl

# 2. Launch the Worker
python aivora_worker.py


🎮 Usage Guide

1. The First Run (Authentication)

When you run python aivora_worker.py for the first time, a Chrome window will open.

Log in to X (Twitter) manually.

Look for the floating overlay button "I'm logged in" (bottom right). Click it.

The bot will save your session cookies. Future runs will be 100% invisible (Headless).

2. Launching a Task

Go to http://localhost:3000.

Upload your Excel/CSV file (Columns: Post URL, Generated Comment).

Set your desired Delay (Recommended: 5-10 seconds).

Click LAUNCH SNIPER.

Watch the magic happen in the "Real-time Logs" panel!

🔧 Troubleshooting

🔴 Worker says "400 Bad Request"

Cause: Mismatch between code variables and folder names.

Fix: Ensure your app/api/job/status/[jobid] folder is named exactly [jobid] (lowercase).

🔴 Worker says "404 Not Found"

Cause: The server isn't running or the URL path is wrong.

Fix: Restart npm run dev. Check if [fileid] folder exists in app/api/job/file/.

🔴 Bot Freezes / Browser Doesn't Open

Cause: The bot thinks it's already logged in but the session is dead.

Fix: Run this command to force a new login window:
PowerShell: Remove-Item -Path "$HOME\.aivora_x_profile\.first_run_completed" -ErrorAction SilentlyContinue

🔴 "Element Click Intercepted"

Cause: A popup is blocking the button.

Fix: The latest aivora_worker.py uses Force Click to punch through popups. Ensure you have the latest code.

📂 File Structure

Aivora-Desk/
├── aivora_worker.py       # The Python Automation Engine
├── app/
│   ├── AivoraDesk.tsx     # The Main Dashboard UI
│   └── api/               # The Backend Logic
│       └── job/
│           ├── create/    # POST: Create new job
│           ├── pending/   # GET: Worker checks for work
│           ├── log/       # POST: Stream logs to UI
│           ├── [jobid]/   # GET: UI polls for status
│           ├── status/
│           │   └── [jobid]/ # POST: Worker updates status
│           └── file/
│               └── [fileid]/ # GET: Worker downloads file
