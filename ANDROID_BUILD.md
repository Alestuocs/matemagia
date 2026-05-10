# Building MateMagia as an Android APK

## Prerequisites

- **Node.js** 18+ with npm
- **Android Studio** (latest stable) — [download](https://developer.android.com/studio)
- **Java 17** (JDK) — Android Studio bundles this; ensure `JAVA_HOME` points to it
- **Android SDK** with API level 33+ (installed via Android Studio SDK Manager)

## Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Build the web app

```bash
npm run build
```

This generates the `dist/` folder.

### 3. Add the Android platform (first time only)

```bash
npx cap add android
```

### 4. Sync web assets to Android

```bash
npx cap sync android
```

Run this every time you change the web app.

### 5. Open Android Studio

```bash
npm run cap:open
# or: npx cap open android
```

### 6. Generate the APK or App Bundle

In Android Studio:

1. Wait for Gradle sync to finish.
2. Go to **Build** → **Generate Signed Bundle / APK…**
3. Choose **APK** (for direct install) or **Android App Bundle** (for Play Store).
4. Create or use an existing keystore for signing.
5. Choose **release** build variant.
6. Click **Finish**.

The APK will be in `android/app/release/app-release.apk`.

## One-command build (subsequent builds)

```bash
npm run build:android
```

Then open Android Studio and generate the signed APK.

## Troubleshooting

- **Gradle sync fails**: Make sure Android SDK is installed and `ANDROID_HOME` env var is set.
- **Java version error**: Use Java 17. Set `JAVA_HOME` to the JDK 17 path.
- **White screen on device**: Check that `webDir` in `capacitor.config.json` is `dist` and you ran `npm run build` before syncing.
- **Permissions**: If you add Capacitor plugins that need permissions, declare them in `android/app/src/main/AndroidManifest.xml`.
