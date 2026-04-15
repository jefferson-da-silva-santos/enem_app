// app/(auth)/lock.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinInput from '../../components/PinInput';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function LockScreen() {
  const { validatePin, isTemporarilyBlocked, blockEndTime, failedAttempts, resetPinAndData } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const blockRemainingMinutes = blockEndTime
    ? Math.ceil((blockEndTime - Date.now()) / 60000)
    : 0;

  const handlePin = async (pin: string) => {
    if (isTemporarilyBlocked) return;
    setIsLoading(true);
    const success = await validatePin(pin);
    setIsLoading(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      const remaining = 5 - (failedAttempts + 1);
      if (remaining <= 0) {
        setError(`App bloqueado por ${blockRemainingMinutes} minutos`);
      } else {
        setError(`PIN incorreto. ${remaining} tentativa(s) restante(s)`);
      }
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Esqueceu seu PIN?',
      'Para redefinir seu PIN, todos os seus dados serão apagados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir e apagar dados',
          style: 'destructive',
          onPress: () => {
            router.push('/(auth)/reset-pin');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>ENEM Prep</Text>
        </View>

        {isTemporarilyBlocked ? (
          <View style={styles.blockedContainer}>
            <Text style={styles.blockedIcon}>🔒</Text>
            <Text style={[styles.blockedTitle, { color: colors.text }]}>App Bloqueado</Text>
            <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
              Muitas tentativas incorretas.{'\n'}
              Tente novamente em {blockRemainingMinutes} minuto(s).
            </Text>
          </View>
        ) : (
          <PinInput
            length={6}
            onComplete={handlePin}
            error={error}
            title="Bem-vindo de volta!"
            subtitle="Digite seu PIN para continuar"
            onForgot={handleForgot}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  appName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  blockedContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  blockedIcon: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  blockedTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  blockedText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
});