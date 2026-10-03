# Little by Little 🌱

> A calm, forgiving, mobile-first habit tracker designed to help people build daily routines through small, manageable habits.

"Routine grows at its own gentle pace." Little by Little celebrates consistency without guilt or pressure when a day is missed.

---

## ✨ Core Principles & Tone

- **Calm & Forgiving:** Missed days appear neutrally as quiet rest days—never with harsh red cross marks, broken streak penalties, or guilt-inducing copy.
- **Warm & Organic Aesthetics:** Warm off-white linen background (`#FAF7F2`), deep forest teal typography (`#1C382F`), and soothing sage, peach, and lavender accents.
- **Privacy by Default:** 100% on-device storage using `localStorage`. No mandatory accounts, no backend tracking, no third-party analytics.
- **Mobile-First & Tactile:** Generous touch targets, rounded cards, micro-interactions with gentle synthesized chimes using Web Audio API.

---

## 📱 Features

1. **Habit Creation & Editing**
   - Habit name and gentle intention / description.
   - Curated wellness emoji picker (💧, 🌿, 📖, 🧘, 🚶, ☕, ✍️, 🍎, etc.) or custom emoji input.
   - Flexible frequency: **Every day** or **Selected days of the week** (M/T/W/T/F/S/S).
   - Optional gentle reminder time.
   - Edit, pause/resume, or delete habits at any time.

2. **Daily Check-Ins & Notes**
   - Today's date with warm greeting and daily progress tracker.
   - One-tap tactile completion with relaxing sound chime.
   - Reversible anytime (undo accidental completions with zero penalty).
   - Daily reflection note field ("How did it feel?", "A quiet thought").
   - Friendly empty state when no habits are due: *"All clear today. Rest is part of the process, too."*

3. **Kind Progress & Streaks**
   - 7-day visual dot strip for every habit (sage green for completed, neutral outline for scheduled/rest days).
   - Current streak and personal best context (e.g., *"4 days together ✨"*).
   - Weekly summary showing total check-ins and active days.

4. **Gentle Reminders**
   - In-app notification banner when a habit is due during active usage.
   - Browser Notification API integration (with clear explanation of browser limitations).
   - Ready for Capacitor Android Local Notifications.

5. **Sample Demo Habits**
   - Pre-populated with 3 friendly demo habits so you can explore immediately.
   - One-click banner to either **Clear demo habits** or **Keep as my own**.

---

## 🚀 Running Locally

Because Little by Little is built with modern, zero-dependency web standards:

1. You can open `index.html` directly in any web browser!
2. Or serve it with any static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```

---

## 🌐 Deploying to GitHub Pages

The repository is pre-configured with `.github/workflows/deploy-pages.yml` and relative path routing (`./styles.css`, `#today`, etc.):

1. Create a repository on GitHub (e.g., `little-by-little`).
2. Push this project to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Little by Little MVP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/little-by-little.git
   git push -u origin main
   ```
3. In GitHub, navigate to **Settings** → **Pages**:
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. The workflow will automatically run and publish your site at:
   `https://<your-username>.github.io/little-by-little/`

---

## 🤖 Android APK & PWA Installation

### Option 1: Instant PWA (Recommended)
1. Open your live GitHub Pages URL in Chrome on Android.
2. Tap the browser menu `(⋮)` → **"Add to Home screen"** or **"Install app"**.
3. Little by Little will install to your app drawer and run full screen with offline support.

### Option 2: Native Android Debug APK via GitHub Actions
This project includes a ready-to-use GitHub Actions workflow (`.github/workflows/build-android-apk.yml`) that builds an Android debug APK using Capacitor and Gradle:

1. When you push to `main` (or run manually via `workflow_dispatch`), the workflow runs on GitHub's Ubuntu runners.
2. The workflow compiles `app-debug.apk` and uploads it under the workflow run's **Artifacts** section as `little-by-little-debug-apk`.
3. Download the artifact ZIP, extract `app-debug.apk`, and transfer it to your Android device.
4. On Android, tap the APK and enable "Allow from this source" when prompted.

---

## 📷 QR Code Configuration

The app includes both an in-app **Install** tab and an `install.html` page featuring a dynamic SVG QR code.
- When running on GitHub Pages (`https://<username>.github.io/<repo>/install.html`), the QR code automatically adapts to your live URL.
- If opened locally or previewed, you can type your GitHub Pages URL into the input field to update the QR code and GitHub Actions links instantly.
