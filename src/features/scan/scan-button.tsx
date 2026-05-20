import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { Alert, Linking, TouchableOpacity, View } from "react-native";

import { AppText } from "@/components/ui";
import { useScanQuotaQuery } from "@/features/scan/scan-hooks";
import { useAppTheme } from "@/lib/theme-provider";

const MAX_FILE_SIZE_BYTES = 5_242_880; // 5 MB
const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

type ScanButtonProps = {
  deckId: string;
  onImageSelected: (uri: string) => void;
  disabled?: boolean;
};

function getFileExtension(uri: string): string {
  const parts = uri.split(".");
  return (parts[parts.length - 1] ?? "").toLowerCase().split("?")[0] ?? "";
}

function isFormatSupported(uri: string): boolean {
  const ext = getFileExtension(uri);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

function showPermissionDeniedAlert(source: "camera" | "gallery") {
  const label = source === "camera" ? "camera" : "photo library";
  Alert.alert(
    "Permission Required",
    `LexiLoop needs access to your ${label} to scan vocabulary from images. Please grant ${label} access when prompted.`,
    [{ text: "OK" }],
  );
}

function showPermanentlyDeniedAlert(source: "camera" | "gallery") {
  const label = source === "camera" ? "camera" : "photo library";
  Alert.alert(
    `${source === "camera" ? "Camera" : "Photo Library"} Permission Required`,
    `LexiLoop needs ${label} access to scan vocabulary from photos. Please enable it in your device settings.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
}

function showValidationError(message: string) {
  Alert.alert("Invalid Image", message, [{ text: "OK" }]);
}

async function requestCameraPermission(): Promise<boolean> {
  const { status, canAskAgain } =
    await ImagePicker.requestCameraPermissionsAsync();

  if (status === "granted") return true;

  if (!canAskAgain) {
    showPermanentlyDeniedAlert("camera");
  } else {
    showPermissionDeniedAlert("camera");
  }

  return false;
}

async function requestGalleryPermission(): Promise<boolean> {
  const { status, canAskAgain } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status === "granted") return true;

  if (!canAskAgain) {
    showPermanentlyDeniedAlert("gallery");
  } else {
    showPermissionDeniedAlert("gallery");
  }

  return false;
}

function validateImage(asset: ImagePicker.ImagePickerAsset): boolean {
  // Check file size
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
    showValidationError(
      "The selected image exceeds the 5 MB size limit. Please choose a smaller image.",
    );
    return false;
  }

  // Check format via URI extension
  if (!isFormatSupported(asset.uri)) {
    showValidationError(
      "Unsupported image format. Please select a JPEG, PNG, or WEBP image.",
    );
    return false;
  }

  return true;
}

export function ScanButton({
  deckId,
  onImageSelected,
  disabled,
}: ScanButtonProps) {
  const { colors } = useAppTheme();
  const quota = useScanQuotaQuery(deckId);
  const remainingScans = quota.data?.remaining_scans;
  const resetTime = quota.data?.reset_time;

  const isLimitReached = remainingScans === 0;
  const isDisabled = disabled || isLimitReached;

  const handleTakePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!validateImage(asset)) return;

    onImageSelected(asset.uri);
  };

  const handleChooseFromGallery = async () => {
    const granted = await requestGalleryPermission();
    if (!granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!validateImage(asset)) return;

    onImageSelected(asset.uri);
  };

  const formatResetTime = (isoTime: string): string => {
    try {
      const date = new Date(isoTime);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "midnight";
    }
  };

  const handlePress = () => {
    if (isLimitReached) {
      const resetLabel = resetTime ? formatResetTime(resetTime) : "midnight";
      Alert.alert(
        "Daily Limit Reached",
        `You've used all 10 scans for today. Your limit resets at ${resetLabel}.`,
        [{ text: "OK" }],
      );
      return;
    }

    Alert.alert(
      "Scan Vocabulary",
      "Choose an image source to extract words from.",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Gallery", onPress: handleChooseFromGallery },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  return (
    <View className="absolute bottom-6 right-6">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          isLimitReached
            ? "Scan vocabulary, daily limit reached"
            : remainingScans !== undefined
              ? `Scan vocabulary, ${remainingScans} scans remaining`
              : "Scan vocabulary"
        }
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: isLimitReached ? colors.muted : colors.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
          opacity: isDisabled && !isLimitReached ? 0.5 : 1,
        }}
        disabled={isDisabled && !isLimitReached}
        onPress={handlePress}
      >
        <Camera color="#ffffff" size={24} />
      </TouchableOpacity>

      {remainingScans !== undefined && (
        <View
          className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full px-1"
          style={{
            backgroundColor: isLimitReached ? colors.danger : colors.warning,
          }}
          accessibilityLabel={
            isLimitReached
              ? "Daily scan limit reached"
              : `${remainingScans} scans remaining today`
          }
          accessibilityLiveRegion="polite"
        >
          <AppText
            className="text-xs font-bold leading-4"
            style={{ color: "#ffffff" }}
          >
            {remainingScans}
          </AppText>
        </View>
      )}
    </View>
  );
}
