# Expo dependency policy

This project was scaffolded without package installation access in the sandbox.

`package.json` intentionally avoids pretending validation has passed. After cloning, install with Expo-aware commands so native package versions match the selected Expo SDK:

```bash
npm install
npx expo install --fix
npm run typecheck
npm run lint
```

If version conflicts appear, prefer Expo SDK-compatible versions reported by:

```bash
npx expo doctor
npx expo install --check
```

Avoid blindly upgrading React, React Native, Reanimated, Gesture Handler, Expo Router, or NativeWind without checking Expo SDK compatibility.
