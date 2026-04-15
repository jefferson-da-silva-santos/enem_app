// app/(auth)/reset-pin.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinInput from '../../components/PinInput';
import { Colors, Spacing, Typography } from '../../constants/theme';

type Step = 'create' | 'confirm';

export default function ResetPinScreen() {
  const { resetPinAndData } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError(null);
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setError('Os PINs não coincidem.');
      setStep('create');
      setFirstPin('');
      return;
    }
    await resetPinAndData(pin);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>

        <View style={[styles.warning, { backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Todos os dados serão apagados ao redefinir o PIN.
          </Text>
        </View>

        <PinInput
          length={6}
          onComplete={step === 'create' ? handleCreate : handleConfirm}
          error={error}
          title={step === 'create' ? 'Novo PIN' : 'Confirme o novo PIN'}
          subtitle={step === 'create'
            ? 'Escolha um novo PIN de 6 dígitos'
            : 'Digite o novo PIN novamente'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xl,
  },
  backText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
});