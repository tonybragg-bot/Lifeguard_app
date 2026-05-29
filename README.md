# LifeGuard Emergency — Native Android Project

Production-ready Android (Kotlin) source that implements the exact flow validated in
the web prototype: a lock-screen medical/SOS app with triple-press volume trigger,
secure 999 responder screen, emergency SMS with live GPS, auto-call, alarm,
flashlight strobe, offline queue, AES-256 encrypted local storage and biometric edit lock.

No server. No network dependency. Everything runs on-device.

---

## 1. Get the source as a ZIP

From the repository root:

```bash
# Zip just the native Android project
zip -r LifeGuard-Android.zip android/

# (or with tar)
tar -czf LifeGuard-Android.tar.gz android/
```

You now have `LifeGuard-Android.zip` containing the full Gradle project.

## 2. Build the APK and the AAB

Requirements: JDK 17, Android SDK (API 34), Android Studio Hedgehog+ (optional).

```bash
cd android

# Debug APK (for testing on a device)
./gradlew assembleDebug
#  -> app/build/outputs/apk/debug/app-debug.apk

# Signed release APK (for sideloading / direct install)
./gradlew assembleRelease
#  -> app/build/outputs/apk/release/app-release.apk

# Signed release Android App Bundle — REQUIRED by Google Play
./gradlew bundleRelease
#  -> app/build/outputs/bundle/release/app-release.aab

# Build both at once
./gradlew assembleRelease bundleRelease
```

> **APK vs AAB:** Use the **APK** for direct installs / sideloading via `adb`.
> Upload the **AAB** to the Google Play Console — Play uses it to generate
> optimized per-device APKs (the `bundle { ... }` block in `app/build.gradle`
> enables ABI / density / language splits).

### Signing the release APK / AAB
Create a keystore once:
```bash
keytool -genkey -v -keystore lifeguard.keystore -alias lifeguard \
  -keyalg RSA -keysize 2048 -validity 10000
```
Add to `app/build.gradle` `signingConfigs` (placeholders included) or pass via
`gradle.properties`:
```
LIFEGUARD_STORE_FILE=lifeguard.keystore
LIFEGUARD_STORE_PASSWORD=********
LIFEGUARD_KEY_ALIAS=lifeguard
LIFEGUARD_KEY_PASSWORD=********
```
The same `signingConfigs.release` block signs both the APK and the AAB.

## 3. Install on a phone

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

## 3b. Automatic builds via GitHub Actions (CI)

Every push builds a signed `app-release.apk` **and** `app-release.aab`
automatically (see `.github/workflows/android.yml`). The workflow checks out the
repo, installs JDK 17 + the Android SDK, bootstraps the Gradle wrapper, runs
`./gradlew assembleRelease bundleRelease` in `android/`, and uploads both
`app-release.apk` (sideload) and `app-release.aab` (Google Play) as separate
downloadable build artifacts.

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Description |
| --- | --- |
| `LIFEGUARD_KEYSTORE_BASE64` | Your keystore, base64-encoded: `base64 -w0 lifeguard.keystore` |
| `LIFEGUARD_STORE_PASSWORD` | Keystore password |
| `LIFEGUARD_KEY_ALIAS` | Key alias (e.g. `lifeguard`) |
| `LIFEGUARD_KEY_PASSWORD` | Key password |

After the run finishes, download the build from the workflow run's **Artifacts**
section: `app-release.apk` for sideloading or `app-release.aab` to upload to the
Google Play Console.

## 3c. Automatic Google Play deployment (internal track)

On pushes to the **`main`** branch only, a second CI job (`deploy-internal`)
runs after the build succeeds. It downloads the signed `app-release.aab`
artifact and uploads it to the **Google Play internal testing track** using the
[`r0adkll/upload-google-play`](https://github.com/r0adkll/upload-google-play)
action. Pull requests, other branches, and manual dispatches do **not** deploy.

Add one more repository secret:

| Secret | Description |
| --- | --- |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON key of a Google Play service account with **Release manager** permission, pasted as plain text. Create it in Google Cloud Console → IAM → Service Accounts, then grant access in Play Console → Users and permissions. |

Notes:
- The app must already exist in the Play Console (package
  `com.lifeguard.emergency`) with at least one manual upload, before the API can
  push new releases.
- The action publishes with `track: internal` and `status: completed`. Change
  the `track` (e.g. `alpha`, `beta`, `production`) or `status` (e.g. `draft`,
  `inProgress`) in `.github/workflows/android.yml` as needed.


## 4. First run / permissions
On first launch the app requests:
- **Accessibility Service** (to detect volume triple-press at the lock screen)
- **SMS**, **Location (fine + background)**, **Phone (call)**, **Camera (flashlight)**, **Contacts**
- **Display over other apps** (to show the medical screen above the lock screen)

These mirror the permissions declared in `AndroidManifest.xml`.

---

## File map
```
android/
├── build.gradle                 # root gradle config
├── settings.gradle
├── gradle.properties
└── app/
    ├── build.gradle             # module config, deps, signing
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/xml/accessibility_service_config.xml
        └── java/com/lifeguard/emergency/
            ├── MainActivity.kt          # owner app (edit info / settings)
            ├── EmergencyActivity.kt     # secure screen shown over lock screen
            ├── VolumeKeyService.kt       # triple-press detection (Accessibility)
            ├── SecureStore.kt            # AES-256 EncryptedSharedPreferences
            ├── MedicalProfile.kt         # data models
            └── EmergencyTools.kt         # SMS / GPS / call / alarm / torch / outbox
```

© 2026 LifeGuard. All rights reserved.
