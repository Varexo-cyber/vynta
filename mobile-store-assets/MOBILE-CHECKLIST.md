# Vynta Mobile App — Voltooiingschecklist

## Wat is gereed

- **PWA**: manifest.webmanifest, service worker, offline pagina, icons
- **Capacitor**: Android + iOS projecten, `nl.vynta.app` bundle ID
- **Native plugins**: StatusBar, SplashScreen, Keyboard, App, Haptics, Network, Preferences, Camera, Filesystem, Share
- **Android permissies**: INTERNET, CAMERA, RECORD_AUDIO, storage, NETWORK_STATE, VIBRATE, POST_NOTIFICATIONS
- **iOS permissies**: NSCameraUsageDescription, NSMicrophoneUsageDescription, NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription, NSDocumentsFolderUsageDescription
- **Bottom navigation**: Feed, Kansen, +, Netwerken, Berichten, Profiel
- **Sessie auth**: Cookie-based, compatibel met Capacitor WebView (sameSite: lax, secure: true)
- **Android signing**: signingConfigs release met keystore.properties support
- **.gitignore**: keystore, .jks, signing secrets uitgesloten

## Wat jij zelf nog moet doen

### Android
1. **Keystore aanmaken**:
   ```bash
   keytool -genkey -v -keystore vynta-release.keystore -alias vynta -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **`android/keystore.properties` aanmaken** (niet committen!):
   ```properties
   storeFile=../vynta-release.keystore
   storePassword=JOUW_WACHTWOORD
   keyAlias=vynta
   keyPassword=JOUW_WACHTWOORD
   ```
3. **Bewaar de keystore en wachtwoorden veilig** — verlies deze nooit!
4. **Android App Bundle bouwen**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   Het `.aab` bestand staat in: `android/app/build/outputs/bundle/release/app-release.aab`
5. **Google Play Console**:
   - Maak een app aan met package `nl.vynta.app`
   - Upload het `.aab` bestand
   - Vul store listing, privacybeleid, etc. in
   - Start interne test

### iOS (vereist Mac + Xcode)
1. Open `ios/App/App.xcworkspace` in Xcode
2. Selecteer je Apple Team onder Signing & Capabilities
3. Set Bundle Identifier: `nl.vynta.app`
4. Archive: Product → Archive
5. Upload naar App Store Connect / TestFlight

### Google OAuth (indien gewenst)
- Voeg deze redirect URIs toe in Google Cloud Console:
  - `https://vynta.nl/auth/callback`
  - `nl.vynta.app://auth/callback` (voor deeplink in app)

### Pushmeldingen
- **Android**: Maak een Firebase project aan, voeg `google-services.json` toe in `android/app/`
- **iOS**: Apple Push Notifications certificaat aanmaken in Apple Developer Portal

## Bestanden gewijzigd

- `src/components/app-shell.tsx` — bottom nav, native features
- `src/lib/capacitor.ts` — native bridge (NIEUW)
- `src/app/layout.tsx` — PWA manifest, service worker, theme colors
- `public/manifest.webmanifest` — PWA manifest (NIEUW)
- `public/sw.js` — service worker (NIEUW)
- `src/app/offline/page.tsx` — offline pagina (NIEUW)
- `capacitor.config.ts` — Capacitor configuratie
- `android/app/build.gradle` — signing config
- `android/app/src/main/AndroidManifest.xml` — permissies
- `ios/App/App/Info.plist` — permissie beschrijvingen
- `.gitignore` — signing secrets

## Store teksten

Zie `mobile-store-assets/store-texts-nl.md`
