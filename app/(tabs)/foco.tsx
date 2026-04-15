// app/(tabs)/foco.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getDatabase } from '../../database/database';
import { Colors, Spacing, Typography, Radius, SUBJECTS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

const DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Foco',
  short_break: 'Pausa Curta',
  long_break: 'Pausa Longa',
};

export default function FocoScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const pulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (isRunning) pulse();
    else pulseAnim.setValue(1);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const handleComplete = async () => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      setCompletedSessions(s => s + 1);

      // Save session
      if (user && sessionId) {
        const db = await getDatabase();
        await db.runAsync(
          'UPDATE sessoes_foco SET fim = datetime("now"), duracao_minutos = ?, concluida = 1 WHERE id = ?',
          [25, sessionId]
        );
      }

      // Auto-switch to break
      if (newCount % 4 === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      switchMode('pomodoro');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
  };

  const startSession = async () => {
    if (user && mode === 'pomodoro') {
      const db = await getDatabase();
      const result = await db.runAsync(
        'INSERT INTO sessoes_foco (usuario_id, tipo, disciplina) VALUES (?, "pomodoro", ?)',
        [user.id, selectedSubject ?? null]
      );
      setSessionId(result.lastInsertRowId);
    }
    setIsRunning(true);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progress = 1 - timeLeft / DURATIONS[mode];
  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference * (1 - progress);

  const modeColor = mode === 'pomodoro' ? Colors.primary : mode === 'short_break' ? Colors.success : Colors.warning;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Modo Foco</Text>

        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {(['pomodoro', 'short_break', 'long_break'] as TimerMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, { backgroundColor: mode === m ? modeColor : 'transparent' }]}
              onPress={() => !isRunning && switchMode(m)}
            >
              <Text style={[styles.modeBtnText, { color: mode === m ? '#fff' : colors.textSecondary }]}>
                {MODE_LABELS[m]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Circle */}
        <Animated.View style={[styles.timerWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerCircle, { borderColor: modeColor + '30', backgroundColor: colors.bgCard }]}>
            <View style={styles.timerInner}>
              <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>
              <Text style={[styles.timerMode, { color: modeColor }]}>{MODE_LABELS[mode]}</Text>
              {completedSessions > 0 && (
                <Text style={[styles.timerSessions, { color: colors.textMuted }]}>
                  {completedSessions} sessão(ões) hoje
                </Text>
              )}
            </View>
          </View>
          {/* Progress ring overlay */}
          <View style={styles.progressRing}>
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i / 60) * 360;
              const isActive = i / 60 <= progress;
              return (
                <View
                  key={i}
                  style={[styles.progressDot, {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -112 },
                    ],
                    backgroundColor: isActive ? modeColor : 'transparent',
                  }]}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Pomodoro Dots */}
        <View style={styles.pomodoroRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[styles.pomodoroDot, {
                backgroundColor: i < (pomodoroCount % 4) ? modeColor : colors.bgInput,
              }]}
            />
          ))}
        </View>

        {/* Subject Selector */}
        {mode === 'pomodoro' && (
          <>
            <Text style={[styles.subjectLabel, { color: colors.textSecondary }]}>Estudando:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
              <View style={styles.subjectRow}>
                {SUBJECTS.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.subjectChip, {
                      backgroundColor: selectedSubject === s.id ? s.color : colors.bgCard,
                      borderColor: selectedSubject === s.id ? s.color : colors.border,
                    }]}
                    onPress={() => setSelectedSubject(selectedSubject === s.id ? null : s.id)}
                    disabled={isRunning}
                  >
                    <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                    <Text style={[styles.subjectChipText, {
                      color: selectedSubject === s.id ? '#fff' : colors.text,
                    }]}>
                      {s.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: modeColor }]}
              onPress={startSession}
            >
              <Text style={styles.mainBtnText}>▶  Iniciar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: Colors.error }]}
              onPress={() => setIsRunning(false)}
            >
              <Text style={styles.mainBtnText}>⏸  Pausar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => {
              setIsRunning(false);
              setTimeLeft(DURATIONS[mode]);
            }}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>↺  Reiniciar</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.tipTitle, { color: colors.text }]}>💡 Dica do treinador</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {mode === 'pomodoro'
              ? 'Concentre-se em uma única tarefa durante este pomodoro. Evite multitarefas para máxima produtividade.'
              : 'Aproveite para descansar, se hidratar e relaxar os olhos. Você merece!'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    alignItems: 'center',
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: Spacing.base,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  modeBtnText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  timerWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    position: 'relative',
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerInner: { alignItems: 'center' },
  timerText: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerMode: { fontSize: Typography.fontSize.sm, fontWeight: '700', marginTop: -4 },
  timerSessions: { fontSize: Typography.fontSize.xs, marginTop: 4 },
  progressRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pomodoroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  pomodoroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectLabel: {
    alignSelf: 'flex-start',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subjectScroll: { width: '100%', marginBottom: Spacing.xl },
  subjectRow: { flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: 2 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  subjectChipText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  controls: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginBottom: Spacing.xl },
  mainBtn: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  mainBtnText: { color: '#fff', fontSize: Typography.fontSize.md, fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  tipCard: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
  },
  tipTitle: { fontSize: Typography.fontSize.sm, fontWeight: '700', marginBottom: Spacing.xs },
  tipText: { fontSize: Typography.fontSize.sm, lineHeight: 20 },
});