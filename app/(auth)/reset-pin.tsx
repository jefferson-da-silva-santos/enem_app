import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';

type Step = 'create' | 'confirm';
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function ResetPinScreen() {
  const { resetPinAndData } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKey = async (key: string) => {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError(null);
      return;
    }
    if (key === "" || pin.length >= 6) return;

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === 6) {
      if (step === 'create') {
        setFirstPin(newPin);
        setStep('confirm');
        setPin("");
      } else {
        if (newPin !== firstPin) {
          Vibration.vibrate([0, 80, 80, 80]);
          setError('Os PINs não coincidem.');
          setStep('create');
          setFirstPin('');
          setPin("");
          return;
        }
        await resetPinAndData(newPin);
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: Colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>

        <View style={[styles.warning, { backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.warningText}>
            ⚠️ Todos os dados serão apagados ao redefinir o PIN.
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {step === 'create' ? 'Novo PIN' : 'Confirme o novo PIN'}
        </Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: colors.textSecondary },
                pin.length > i && { backgroundColor: Colors.primary, borderColor: Colors.primary }
              ]}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.keypad}>
          {KEYS.map((key, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.key, key === "" && { opacity: 0 }]}
              onPress={() => handleKey(key)}
              disabled={key === ""}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  back: { alignSelf: 'flex-start', marginBottom: Spacing.xl },
  backText: { fontSize: Typography.fontSize.base, fontWeight: '600' },
  warning: { padding: Spacing.base, borderRadius: 12, marginBottom: Spacing.xl, width: '100%' },
  warningText: { color: '#B91C1C', fontSize: Typography.fontSize.sm, textAlign: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: '700', marginBottom: Spacing.base },
  dotsRow: { flexDirection: 'row', gap: 15, marginBottom: Spacing['2xl'] },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  errorText: { color: '#EF4444', marginBottom: Spacing.base },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12, justifyContent: 'center' },
  key: { width: 75, height: 75, borderRadius: 38, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '600' },
});