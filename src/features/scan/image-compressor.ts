import * as ImageManipulator from "expo-image-manipulator";

import type {
  CompressionError,
  CompressionResult,
} from "@/features/scan/scan-types";

const MAX_DIMENSION = 1536;
const MAX_SIZE_BYTES = 1_048_576; // 1 MB
const INITIAL_QUALITY = 0.7;
const MIN_QUALITY = 0.3;
const QUALITY_STEP = 0.1;

/**
 * Estimate the byte size of a base64-encoded string.
 */
function estimateBase64Bytes(base64: string): number {
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Calculate resize dimensions so the longest side is at most MAX_DIMENSION,
 * preserving aspect ratio. Returns undefined if no resize is needed.
 */
export function calculateResizeDimensions(
  width: number,
  height: number,
): { width: number; height: number } | undefined {
  const longestSide = Math.max(width, height);

  if (longestSide <= MAX_DIMENSION) {
    return undefined;
  }

  const scale = MAX_DIMENSION / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Compress an image to JPEG ≤ 1 MB using iterative quality reduction.
 *
 * 1. Resize so longest side ≤ 1536px (preserving aspect ratio)
 * 2. Compress at quality 0.7, then reduce by 0.1 until ≤ 1 MB or quality reaches 0.3
 * 3. Return base64 string (no data URI prefix) and size in bytes
 * 4. Throw CompressionError with code "TOO_LARGE" if still over 1 MB at minimum quality
 */
export async function compressImage(uri: string): Promise<CompressionResult> {
  // Get original dimensions
  const info = await ImageManipulator.manipulateAsync(uri, []);
  const resizeDims = calculateResizeDimensions(info.width, info.height);

  const actions: ImageManipulator.Action[] = resizeDims
    ? [{ resize: { width: resizeDims.width, height: resizeDims.height } }]
    : [];

  let quality = INITIAL_QUALITY;

  while (quality >= MIN_QUALITY - 0.001) {
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });

    const base64 = result.base64!;
    const sizeBytes = estimateBase64Bytes(base64);

    if (sizeBytes <= MAX_SIZE_BYTES) {
      return { base64, sizeBytes };
    }

    quality = Math.round((quality - QUALITY_STEP) * 10) / 10;
  }

  const error: CompressionError = {
    code: "TOO_LARGE",
    message:
      "Image is too complex to compress below 1 MB. Try a smaller or clearer image.",
  };
  throw error;
}
