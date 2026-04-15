// components/PinInput.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Vibration,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';

interface PinInputProps {
  length?: 4 | 6;
  onComplete: (pin: string) => void;
  error?: string | null;
  title?: string;
  subtitle?: string;
  onForgot?: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function PinInput({
  length = 6,
  onComplete,
  error,
  title,
  subtitle,
  onForgot,
}: PinInputProps) {
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  const shake = useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  React.useEffect(() => {
    if (error) {
      shake();
      setPin('');
    }
  }, [error]);

  const handleKey = useCallback((key: string) => {
    if (key === '') return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === length) {
      onComplete(newPin);
      setPin('');
    }
  }, [pin, length, onComplete]);

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}

      {/* PIN Dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length
                  ? Colors.primary
                  : error
                    ? Colors.error
                    : isDark ? Colors.dark.border : Colors.light.border,
                borderColor: i < pin.length
                  ? Colors.primary
                  : error
                    ? Colors.error
                    : isDark ? Colors.dark.border : Colors.light.border,
              },
            ]}
          />
        ))}
      </Animated.View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  styles.key,
                  {
                    backgroundColor: key === ''
                      ? 'transparent'
                      : isDark ? Colors.dark.bgCard : Colors.light.bgCard,
                    borderColor: key === '' ? 'transparent' : isDark ? Colors.dark.border : Colors.light.border,
                  },
                ]}
                onPress={() => handleKey(key)}
                disabled={key === ''}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.keyText,
                  {
                    color: key === '⌫' ? Colors.error : colors.text,
                    fontSize: key === '⌫' ? 20 : Typography.fontSize['2xl'],
                  }
                ]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {onForgot && (
        <TouchableOpacity onPress={onForgot} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: Colors.primary }]}>
            Esqueci meu PIN
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    marginTop: -Spacing.base,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  keypad: {
    gap: Spacing.md,
    width: '100%',
    maxWidth: 280,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  key: {
    flex: 1,
    height: 68,
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontWeight: '600',
  },
  forgotBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  forgotText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
});