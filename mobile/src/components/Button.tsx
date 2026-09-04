import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  const isFilled = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant !== 'primary' && variantStyles[variant],
        isFilled && styles.glow,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={isFilled ? colors.white : variant === 'ghost' ? colors.muted : colors.primaryBright} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                variant === 'secondary' && styles.textAccent,
                variant === 'ghost' && styles.textGhost,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
    paddingHorizontal: spacing(2),
    marginTop: spacing(1.5),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
  },
  text: { color: colors.white, fontSize: 16, fontWeight: '700' },
  textAccent: { color: colors.primaryBright },
  textGhost: { color: colors.muted, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

const variantStyles: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(200,30,58,0.45)' },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
};
