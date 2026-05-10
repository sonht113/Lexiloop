import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { useAppTheme } from '@/lib/theme-provider';
import { AppText } from './app-text';

type AppAlertVariant = 'info' | 'success' | 'warning' | 'danger';

export type AppAlertAction = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

type AppAlertOptions = {
  title: string;
  message?: string;
  variant?: AppAlertVariant;
  actions?: AppAlertAction[];
};

type AppAlertContextValue = {
  show: (options: AppAlertOptions) => void;
  hide: () => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  const [options, setOptions] = useState<AppAlertOptions | null>(null);

  const hide = () => setOptions(null);
  const actions = options?.actions?.length ? options.actions : [{ text: 'OK', style: 'default' as const }];
  const variant = options?.variant ?? inferVariant(actions);
  const Icon = getVariantIcon(variant);
  const toneColor = getVariantColor(variant, colors);

  const value = useMemo<AppAlertContextValue>(() => ({ show: setOptions, hide }), []);

  const runAction = (action: AppAlertAction) => {
    hide();
    void action.onPress?.();
  };

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(options)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={hide}
      >
        <View className="flex-1 justify-end px-5 pb-8" style={{ backgroundColor: 'rgba(2, 6, 23, 0.56)' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close alert" className="absolute inset-0" onPress={hide} />
          <View
            className="overflow-hidden rounded-[24px] border p-5 shadow-2xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="flex-row items-start gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${toneColor}22` }}>
                <Icon color={toneColor} size={23} strokeWidth={2.5} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="text-xl font-bold leading-7" style={{ color: colors.text }}>
                  {options?.title}
                </AppText>
                {options?.message ? (
                  <AppText className="mt-2 text-base leading-6" style={{ color: colors.muted }}>
                    {options.message}
                  </AppText>
                ) : null}
              </View>
            </View>

            <View className={`${actions.length <= 2 ? 'mt-6 flex-row' : 'mt-5'} gap-3`}>
              {actions.map((action) => {
                const isCancel = action.style === 'cancel';
                const isDestructive = action.style === 'destructive';
                const isPrimary = !isCancel && !isDestructive;
                const backgroundColor = isPrimary ? colors.primary : isDestructive ? `${colors.danger}22` : colors.primarySoft;
                const textColor = isPrimary ? '#ffffff' : isDestructive ? colors.danger : colors.primary;

                return (
                  <Pressable
                    key={action.text}
                    accessibilityRole="button"
                    className={`${actions.length <= 2 ? 'flex-1' : 'w-full'} min-h-12 items-center justify-center rounded-2xl px-4`}
                    style={{ backgroundColor }}
                    onPress={() => runAction(action)}
                  >
                    <AppText className="text-base font-semibold" style={{ color: textColor }}>
                      {action.text}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) throw new Error('useAppAlert must be used within AppAlertProvider');
  return context;
}

function inferVariant(actions: AppAlertAction[]): AppAlertVariant {
  return actions.some((action) => action.style === 'destructive') ? 'danger' : 'info';
}

function getVariantIcon(variant: AppAlertVariant) {
  if (variant === 'success') return CheckCircle2;
  if (variant === 'warning') return AlertTriangle;
  if (variant === 'danger') return XCircle;
  return Info;
}

function getVariantColor(variant: AppAlertVariant, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (variant === 'success') return colors.success;
  if (variant === 'warning') return colors.warning;
  if (variant === 'danger') return colors.danger;
  return colors.primary;
}
