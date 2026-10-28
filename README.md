<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Marketplace Platform

A high-performance marketplace platform built with React, Vite, Tailwind CSS, and Firebase. This project is optimized for both Web and Mobile (Android/iOS) via Capacitor.

## VS Code Setup

This project includes a `.vscode` folder with pre-configured settings to enhance your development experience:

1. **Recommended Extensions**: When you open this folder in VS Code, you should see a prompt to install recommended extensions (ESLint, Prettier, Tailwind CSS).
2. **Auto Formatting**: The project is configured to auto-format on save using Prettier and run ESLint fixes.
3. **Debugging**: You can press `F5` to start debugging the app in Chrome.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file and add your credentials:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Firebase Configuration for Login

To ensure authentication works across all environments, follow these steps in your [Firebase Console](https://console.firebase.google.com/):

### 1. Authorized Domains (for Localhost)
If you are running the app on a custom domain or different localhost port:
- Go to **Authentication** > **Settings** > **Authorized domains**.
- Add `localhost` and your production domain.

### 2. Android Configuration (for APK/Native)
To enable Google Login on Android:
- Go to **Project Settings** > **General**.
- Add an Android App with package name `com.npmart.marketplace` (matching `capacitor.config.ts`).
- Download `google-services.json` and place it in `android/app/`.
- **CRITICAL**: Add your **SHA-1 fingerprint** to the Android app settings in Firebase. 
  - For development, you can get this via keytool or by running `./gradlew signingReport` in the `android` folder.
  - Without the SHA-1, Google Sign-In will fail with a generic "Developer Error".

### 3. iOS Configuration
- Add an iOS App in Firebase.
- Download `GoogleService-Info.plist` and add it to your Xcode project.

## Customizing Your App Logo

To add your own logo and have it automatically apply to all icons and splash screens:

1. Create a `assets/` folder in the root of your project.
2. Place three files in it:
   - `icon-only.png` (1024x1024 recommended)
   - `icon-foreground.png` (for Android adaptive icons)
   - `icon-background.png` (for Android adaptive icons)
   - `splash.png` (2732x2732 recommended)
   - `splash-dark.png` (optional)
3. Run the asset generation script:
   ```bash
   npm run cap:assets
   ```
   This will automatically resize and copy the icons to the correct Android and iOS folders.

## Build APK or Android Bundle via VS Code

You can build your app directly using the VS Code terminal without opening Android Studio:

### 1. Requirements
Ensure you have the **Android SDK** and **Java (JDK 17+)** installed on your machine and added to your system path.

### 2. Build for Release
To generate an APK or AAB for publishing:

- **Build APK**:
  ```bash
  npm run android:build:apk
  ```
- **Build Android Bundle (AAB)**:
  ```bash
  npm run android:build:bundle
  ```

The files will be generated in:
- APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### 3. Signing the APK
Before you can install the release APK on a phone, you must sign it using `apksigner` (part of the Android SDK).
```bash
# Example (after generating a keystore)
apksigner sign --ks my-release-key.jks --out app-release-signed.apk app-release-unsigned.apk
```

## Authentication & Android Setup Guide

### 1. Fixing "Authorization Failed" in VS Code
If you see an error like "Authorization failed" when running on `localhost:3000`:
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Go to **Build** > **Authentication** > **Settings**.
3. Click the **Authorized domains** tab.
4. Check if `localhost` is in the list. If not, click **Add domain** and add `localhost`.

### 2. Finding & Placing `google-services.json`
This file is NOT in the source code; you must download it from Firebase for your specific project:
1. In [Firebase Console](https://console.firebase.google.com/), go to **Project Settings** (gear icon).
2. In the **General** tab, scroll down to **Your apps**.
3. If you haven't added an Android app, click **Add app** > **Android**.
   - **Package Name**: Use `com.npmart.marketplace` (exactly as in `capacitor.config.ts`).
4. Once registered, click **Download google-services.json**.
5. **Placement**: In VS Code, place this file in your project at:
   `android/app/google-services.json`
   *(If the `android` folder doesn't exist yet, run `npx cap add android` in your terminal first).*

### 3. Build APK/Bundle without Android Studio
Once your environment is set up (Android SDK + Java), you can run these in VS Code terminal:
- Build APK: `npm run android:build:apk`
- Build Bundle: `npm run android:build:bundle`

### 4. Customizing App Logo
1. Create an `assets/` folder in the root.
2. Put `icon-only.png` and `splash.png` inside.
3. Run `npm run cap:assets`.

1. **Build and Sync**:
   ```bash
   npm run cap:sync
   ```
2. **Open in IDE**:
   - iOS: `npm run cap:open:ios` (Requires Xcode)
   - Android: `npm run cap:open:android` (Requires Android Studio)

## Tech Stack

- **Frontend**: React 18, Vite, Framer Motion
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Mobile**: Capacitor
- **Icons**: Lucide React
