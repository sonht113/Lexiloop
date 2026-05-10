import * as SecureStore from 'expo-secure-store';

const ONBOARDING_SEEN_KEY = 'lexiloop_onboarding_seen';

export async function getOnboardingSeen() {
  const value = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
  return value === 'true';
}

export async function setOnboardingSeen() {
  await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, 'true');
}
