import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Vibration, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../constants/theme';

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LockScreen() {
  const { validatePin, isTemporarilyBlocked, blockEndTime, failedAttempts } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const blockRemainingMinutes = blockEndTime
    ? Math.ceil((blockEndTime - Date.now()) / 60000)
    : 0;

  const handleKey = async (key: string) => {
    if (isTemporarilyBlocked || isLoading) return;

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError(null);
      return;
    }
    if (key === "" || pin.length >= 6) return;

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === 6) {
      setIsLoading(true);
      const success = await validatePin(newPin);
      setIsLoading(false);

      if (success) {
        router.replace('/(tabs)');
      } else {
        Vibration.vibrate([0, 80, 80, 80]);
        setPin("");
        const remaining = 5 - (failedAttempts + 1);
        if (remaining <= 0) {
          setError(`App bloqueado por ${blockRemainingMinutes} minutos`);
        } else {
          setError(`PIN incorreto. ${remaining} tentativa(s) restante(s)`);
        }
      }
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Esqueceu seu PIN?',
      'Para redefinir seu PIN, todos os seus dados serão apagados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Redefinir e apagar dados', style: 'destructive', onPress: () => router.push('/(auth)/reset-pin') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>ENEM Prep</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {isTemporarilyBlocked ? 'Muitas tentativas incorretas' : 'Bem-vindo de volta!'}
          </Text>
        </View>

        {isTemporarilyBlocked ? (
          <View style={styles.blockedContainer}>
            <Text style={styles.blockedIcon}>🔒</Text>
            <Text style={[styles.blockedTitle, { color: colors.text }]}>App Bloqueado</Text>
            <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
              Tente novamente em {blockRemainingMinutes} minuto(s).
            </Text>
          </View>
        ) : (
          <>
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

            <View style={styles.errorContainer}>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <View style={styles.keypad}>
              {KEYS.map((key, idx) => (
                <View key={idx} style={styles.keyWrapper}>
                  <TouchableOpacity
                    style={[styles.key, key === "" && { opacity: 0 }]}
                    onPress={() => handleKey(key)}
                    disabled={key === "" || isLoading}
                  >
                    <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleForgot} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: Colors.primary }]}>Esqueceu o PIN?</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl
  },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  appName: { fontSize: Typography.fontSize.xl, fontWeight: '800', marginBottom: Spacing.xs },
  tagline: { fontSize: Typography.fontSize.sm },
  dotsRow: { flexDirection: 'row', gap: 12, marginVertical: Spacing.xl },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  errorContainer: { height: 20, marginBottom: Spacing.base },
  errorText: { color: '#EF4444', fontSize: Typography.fontSize.xs, textAlign: 'center' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
    marginBottom: Spacing.xl
  },
  keyWrapper: { width: '33.3%', padding: 10, alignItems: 'center', justifyContent: 'center' },
  key: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 75,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: { fontSize: 24, fontWeight: '600' },
  forgotBtn: { marginTop: Spacing.sm, padding: Spacing.sm },
  forgotText: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  blockedContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  blockedIcon: { fontSize: 48, marginBottom: Spacing.base },
  blockedTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  blockedText: { fontSize: Typography.fontSize.base, textAlign: 'center' },
});