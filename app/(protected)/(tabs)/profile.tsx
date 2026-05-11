import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  View,
  type ColorValue,
} from "react-native";
import {
  Bell,
  Camera,
  ChevronRight,
  Download,
  FileText,
  Flame,
  LogOut,
  Moon,
  Sun,
  Target,
  Trophy,
  Users,
} from "lucide-react-native";
import { AppText, Screen, useAppAlert } from "@/components/ui";
import { useSignOutMutation } from "@/features/auth/auth-hooks";
import {
  getProfileAvatarPublicUrl,
  useExportProfileDataMutation,
  useProfileStatsQuery,
  useUploadProfileAvatarMutation,
} from "@/features/profile/profile-hooks";
import {
  getLastReminderSyncResult,
  type ReminderSyncResult,
} from "@/features/reminder/notification-service";
import { useReminderSettingsQuery } from "@/features/reminder/reminder-hooks";
import { ThemeMode, useAppTheme } from "@/lib/theme-provider";

type StatCardProps = {
  title: string;
  value: string | number;
  caption: string;
  icon: ComponentType<{
    color?: ColorValue;
    size?: number;
    strokeWidth?: number;
  }>;
  iconColor: string;
  featured?: boolean;
};

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon: ComponentType<{
    color?: ColorValue;
    size?: number;
    strokeWidth?: number;
  }>;
  danger?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onPress: () => void;
};

function formatReminderTime(enabled?: boolean, time?: string | null) {
  if (!enabled) return "Off";
  if (!time) return "Daily";

  const [hourText, minuteText] = time.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "Daily";

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `Daily at ${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function getReminderStatusSubtitle(
  reminderText: string,
  enabled?: boolean,
  syncResult?: ReminderSyncResult | null,
) {
  if (
    !enabled ||
    !syncResult ||
    syncResult.status === "scheduled" ||
    syncResult.status === "disabled"
  )
    return reminderText;
  return `${reminderText} - ${syncResult.message}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const stats = useProfileStatsQuery();
  const reminder = useReminderSettingsQuery();
  const signOut = useSignOutMutation();
  const exportData = useExportProfileDataMutation();
  const uploadAvatar = useUploadProfileAvatarMutation();
  const theme = useAppTheme();
  const appAlert = useAppAlert();
  const { colors } = theme;
  const [reminderSyncResult, setReminderSyncResult] =
    useState<ReminderSyncResult | null>(null);

  const username = stats.data?.profile.username ?? "Learner";
  const initial = username.slice(0, 1).toUpperCase();
  const avatarUrl = useMemo(
    () => getProfileAvatarPublicUrl(stats.data?.profile.avatar_url),
    [stats.data?.profile.avatar_url],
  );
  const accuracy = stats.data?.accuracy;
  const reminderSubtitle = getReminderStatusSubtitle(
    formatReminderTime(reminder.data?.enabled, reminder.data?.time),
    reminder.data?.enabled,
    reminderSyncResult,
  );

  useEffect(() => {
    let isMounted = true;

    getLastReminderSyncResult().then((result) => {
      if (isMounted) setReminderSyncResult(result);
    });

    return () => {
      isMounted = false;
    };
  }, [
    reminder.data?.enabled,
    reminder.data?.time,
    reminder.data?.repeat_days,
    reminder.data?.message,
  ]);

  const confirmSignOut = () => {
    appAlert.show({
      title: "Sign out?",
      message: "You can sign in again anytime.",
      variant: "danger",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => signOut.mutate(),
        },
      ],
    });
  };

  const chooseTheme = () => {
    const applyTheme = async (mode: ThemeMode) => {
      try {
        await theme.setMode(mode);
      } catch (error) {
        appAlert.show({
          title: "Theme failed",
          message: error instanceof Error ? error.message : "Please try again.",
          variant: "danger",
        });
      }
    };

    appAlert.show({
      title: "Theme",
      message: "Choose your app appearance.",
      actions: [
        { text: "Light", onPress: () => void applyTheme("light") },
        { text: "Dark", onPress: () => void applyTheme("dark") },
        { text: "Cancel", style: "cancel" },
      ],
    });
  };

  const chooseAvatar = async () => {
    try {
      const profile = await uploadAvatar.mutateAsync();
      if (profile) {
        appAlert.show({
          title: "Avatar updated",
          message: "Your profile photo has been saved.",
          variant: "success",
        });
      }
    } catch (error) {
      appAlert.show({
        title: "Upload failed",
        message: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
      });
    }
  };

  const shareExport = async () => {
    try {
      const exportFile = await exportData.mutateAsync();
      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        await Sharing.shareAsync(exportFile.uri, {
          dialogTitle: "LexiLoop data export",
          mimeType: exportFile.mimeType,
          UTI: "public.json",
        });
      } else {
        await Share.share({
          message: exportFile.textFallback,
          title: "LexiLoop data export",
        });
      }
    } catch (error) {
      appAlert.show({
        title: "Export failed",
        message: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
      });
    }
  };

  const StatCard = ({
    title,
    value,
    caption,
    icon: Icon,
    iconColor,
    featured,
  }: StatCardProps) => (
    <View
      className="h-[130px] flex-1 overflow-hidden rounded-xl border p-4"
      style={{
        backgroundColor: featured ? colors.primary : colors.surface,
        borderColor: featured ? colors.primary : colors.border,
      }}
    >
      {featured ? (
        <View className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/20" />
      ) : (
        <View
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full"
          style={{ backgroundColor: colors.primarySoft, opacity: 0.45 }}
        />
      )}

      <View className="flex-row items-center gap-2">
        <Icon
          color={featured ? "#ffffff" : iconColor}
          size={22}
          strokeWidth={2.5}
        />
        <AppText
          className="text-md font-semibold"
          style={{ color: featured ? "#ffffff" : colors.muted }}
        >
          {title}
        </AppText>
      </View>
      <View className="mt-auto">
        <AppText
          className="text-[40px] font-bold leading-[44px]"
          style={{ color: featured ? "#ffffff" : colors.text }}
        >
          {value}
        </AppText>
        <AppText
          className="text-lg leading-6"
          style={{ color: featured ? "#ffffff" : colors.muted }}
        >
          {caption}
        </AppText>
      </View>
    </View>
  );

  const SettingsRow = ({
    title,
    subtitle,
    icon: Icon,
    danger,
    disabled,
    showChevron = true,
    onPress,
  }: SettingsRowProps) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`min-h-[74px] flex-row items-center justify-between px-4 ${disabled ? "opacity-60" : ""}`}
      onPress={onPress}
    >
      <View className="flex-1 flex-row items-center gap-4">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primarySoft }}
        >
          <Icon
            color={danger ? colors.danger : colors.primary}
            size={22}
            strokeWidth={2.4}
          />
        </View>
        <View className="flex-1">
          <AppText
            className="text-lg font-semibold leading-6"
            style={{ color: danger ? colors.danger : colors.text }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              className="mt-0.5 text-sm leading-5"
              style={{ color: colors.muted }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {showChevron ? (
        <ChevronRight color="#94A3B8" size={22} strokeWidth={2.4} />
      ) : null}
    </Pressable>
  );

  return (
    <Screen className="px-0" style={{ backgroundColor: colors.canvas }}>
      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose profile avatar"
            disabled={uploadAvatar.isPending}
            className={`relative mb-3 h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 shadow-sm ${uploadAvatar.isPending ? "opacity-80" : ""}`}
            style={{ backgroundColor: colors.primarySoft, borderColor: colors.surface }}
            onPress={() => void chooseAvatar()}
          >
            {avatarUrl ? (
              <Image
                accessibilityLabel="Profile avatar"
                className="h-full w-full"
                source={{ uri: avatarUrl }}
                resizeMode="cover"
              />
            ) : (
              <AppText
                className="text-4xl font-bold"
                style={{ color: colors.primary }}
              >
                {initial}
              </AppText>
            )}
            <View
              className="absolute bottom-1 right-1 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              {uploadAvatar.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Camera color="#ffffff" size={13} strokeWidth={2.5} />
              )}
            </View>
          </Pressable>
          <AppText
            className="text-2xl font-bold leading-8"
            style={{ color: colors.text }}
          >
            {username}
          </AppText>
          <AppText
            className="mt-2 text-base font-medium"
            style={{ color: colors.muted }}
          >
            Enthusiastic Learner
          </AppText>
        </View>

        <View className="mt-10">
          <AppText className="text-xl font-bold" style={{ color: colors.text }}>
            Your Progress
          </AppText>
          <View className="mt-6 gap-4">
            <View className="flex-row gap-4">
              <StatCard
                title="Current Streak"
                value={stats.data?.currentStreak ?? "-"}
                caption="days"
                icon={Flame}
                iconColor={colors.warning}
              />
              <StatCard
                title="Total Words"
                value={stats.data?.totalWords ?? "-"}
                caption="captured"
                icon={FileText}
                iconColor="#ffffff"
                featured
              />
            </View>
            <View className="flex-row gap-4">
              <StatCard
                title="Mastered"
                value={stats.data?.masteredWords ?? "-"}
                caption="words"
                icon={Trophy}
                iconColor={colors.success}
              />
              <StatCard
                title="Accuracy"
                value={accuracy == null ? "-" : `${accuracy}%`}
                caption="all time"
                icon={Target}
                iconColor="#6f50bd"
              />
            </View>
          </View>
        </View>

        <View
          className="mt-9 overflow-hidden rounded-xl border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <SettingsRow
            title="Daily Reminder"
            subtitle={reminderSubtitle}
            icon={Bell}
            onPress={() => router.push("/(protected)/reminder")}
          />
          <View className="h-px" style={{ backgroundColor: colors.border }} />
          <SettingsRow
            title="Leaderboard"
            subtitle="Compare mastered words with other learners"
            icon={Users}
            onPress={() => router.push("/(protected)/leaderboard")}
          />
          <View className="h-px" style={{ backgroundColor: colors.border }} />
          <SettingsRow
            title="Theme"
            subtitle={theme.mode === "dark" ? "Dark" : "Light"}
            icon={theme.mode === "dark" ? Moon : Sun}
            onPress={chooseTheme}
          />
          <View className="h-px" style={{ backgroundColor: colors.border }} />
          <SettingsRow
            title="Export Data"
            subtitle={
              exportData.isPending
                ? "Preparing backup..."
                : "Backup your progress"
            }
            icon={Download}
            disabled={exportData.isPending}
            onPress={() => void shareExport()}
          />
          <View className="h-px" style={{ backgroundColor: colors.border }} />
          <SettingsRow
            title={signOut.isPending ? "Signing Out..." : "Sign Out"}
            icon={LogOut}
            danger
            disabled={signOut.isPending}
            showChevron={false}
            onPress={confirmSignOut}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
