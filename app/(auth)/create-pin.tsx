// app/(auth)/create-pin.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinInput from '../../components/PinInput';
import { Colors, Spacing, Typography } from '../../constants/theme';

type Step = 'create' | 'confirm';

export default function CreatePinScreen() {
  const { createPin } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError(null);
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setError('Os PINs não coincidem. Tente novamente.');
      setStep('create');
      setFirstPin('');
      return;
    }
    setIsLoading(true);
    try {
      await createPin(pin);
      router.replace('/(tabs)');
    } catch {
      setError('Erro ao criar PIN. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Branding */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>ENEM Prep</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Seu treinador inteligente para o ENEM
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.bgCard, shadowColor: colors.shadow }]}>
          <PinInput
            length={6}
            onComplete={step === 'create' ? handleCreate : handleConfirm}
            error={error}
            title={step === 'create' ? 'Crie seu PIN' : 'Confirme seu PIN'}
            subtitle={
              step === 'create'
                ? 'Escolha um PIN de 6 dígitos para proteger seu progresso'
                : 'Digite o PIN novamente para confirmar'
            }
          />
        </View>

        <Text style={[styles.securityNote, { color: colors.textMuted }]}>
          🔒 Seu PIN é armazenado de forma segura e criptografada
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  logoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  appName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: Spacing.xl,
  },
  securityNote: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
});