import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";

import { useScanStore } from "@/features/scan/scan-store";
import type { ScanError } from "@/features/scan/scan-types";

const MAX_RETRIES = 3;

type ScanErrorOverlayProps = {
  onRetry: () => void;
  onDismiss: () => void;
};

function getErrorMessage(error: ScanError): string {
  switch (error.code) {
    case "RATE_LIMIT": {
      const resetTime = error.resetTime
        ? new Date(error.resetTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "midnight";
      return `Daily limit reached (10 scans). Resets at ${resetTime}.`;
    }
    case "UNPROCESSABLE":
      return "Could not read text from this image. Try a clearer photo.";
    case "UNAVAILABLE":
      return "AI service temporarily unavailable. Try again shortly.";
    case "NETWORK":
      return "Connection failed. Check your internet and try again.";
    case "TIMEOUT":
      return "Request timed out. Try again.";
    case "UNKNOWN":
    default:
      return "Something went wrong. Please try again.";
  }
}

function getErrorTitle(error: ScanError): string {
  switch (error.code) {
    case "RATE_LIMIT":
      return "Scan Limit Reached";
    case "UNPROCESSABLE":
      return "Image Not Readable";
    case "UNAVAILABLE":
      return "Service Unavailable";
    case "NETWORK":
      return "Connection Error";
    case "TIMEOUT":
      return "Request Timeout";
    case "UNKNOWN":
    default:
      return "Scan Error";
  }
}

export function ScanErrorOverlay({
  onRetry,
  onDismiss,
}: ScanErrorOverlayProps) {
  const router = useRouter();
  const error = useScanStore((s) => s.error);
  const retryCountRef = useRef(0);
  const lastShownErrorRef = useRef<string | null>(null);

  const handleDismiss = useCallback(() => {
    retryCountRef.current = 0;
    onDismiss();
  }, [onDismiss]);

  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;

    if (retryCountRef.current >= MAX_RETRIES) {
      Alert.alert("Too Many Attempts", "Please try again later.", [
        { text: "OK", onPress: handleDismiss },
      ]);
      return;
    }

    onRetry();
  }, [onRetry, handleDismiss]);

  useEffect(() => {
    if (!error) {
      lastShownErrorRef.current = null;
      return;
    }

    // Prevent showing the same error alert multiple times
    const errorKey = `${error.code}-${error.message}`;
    if (lastShownErrorRef.current === errorKey) {
      return;
    }
    lastShownErrorRef.current = errorKey;

    // AUTH errors: immediately redirect to sign-in
    if (error.code === "AUTH") {
      retryCountRef.current = 0;
      onDismiss();
      router.replace("/(auth)/sign-in");
      return;
    }

    const title = getErrorTitle(error);
    const message = getErrorMessage(error);

    // Build alert buttons based on error type
    const buttons: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "default" | "destructive";
    }[] = [];

    if (error.retryable) {
      buttons.push({ text: "Retry", onPress: handleRetry });
      buttons.push({
        text: "Dismiss",
        style: "cancel",
        onPress: handleDismiss,
      });
    } else {
      // Non-retryable errors (RATE_LIMIT) only get dismiss
      buttons.push({ text: "OK", onPress: handleDismiss });
    }

    Alert.alert(title, message, buttons);
  }, [error, router, onDismiss, handleRetry, handleDismiss]);

  // This component renders nothing — it uses Alert.alert for display
  return null;
}
