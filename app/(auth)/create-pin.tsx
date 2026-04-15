import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';

type Step = 'create' | 'confirm';
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function CreatePinScreen() {
  const { createPin } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleKey = async (key: string) => {
    if (isLoading) return;
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
          setError('Os PINs não coincidem. Tente novamente.');
          setStep('create');
          setFirstPin('');
          setPin("");
          return;
        }

        setIsLoading(true);
        try {
          await createPin(newPin);
          router.replace('/(tabs)');
        } catch {
          setError('Erro ao criar PIN.');
          setPin("");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>ENEM Prep</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {step === 'create' ? 'Crie seu PIN de 6 dígitos' : 'Confirme seu novo PIN'}
          </Text>
        </View>

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
              disabled={key === "" || isLoading}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.securityNote, { color: colors.textMuted }]}>
          🔒 Seu PIN é armazenado de forma segura
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing['3xl'] },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { width: 60, height: 60, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  appName: { fontSize: Typography.fontSize['xl'], fontWeight: '800', marginBottom: Spacing.xs },
  tagline: { fontSize: Typography.fontSize.sm, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 15, marginVertical: Spacing.xl },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  errorText: { color: '#EF4444', marginBottom: Spacing.base, textAlign: 'center' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12, justifyContent: 'center', marginBottom: Spacing.xl },
  key: { width: 75, height: 75, borderRadius: 38, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '600' },
  securityNote: { fontSize: Typography.fontSize.xs, textAlign: 'center' },
});