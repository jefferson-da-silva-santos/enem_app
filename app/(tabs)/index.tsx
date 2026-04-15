// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { performanceRepository, DesempenhoItem, StreakData } from '../../database/repositories/performanceRepository';
import { Colors, Spacing, Typography, Radius, SUBJECTS } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState<StreakData>({ streak_atual: 0, streak_maximo: 0, ultima_atividade: '' });
  const [meta, setMeta] = useState({ questoes_respondidas: 0, minutos_estudados: 0, meta_questoes: 20, meta_minutos: 120 });
  const [fraquezas, setFraquezas] = useState<DesempenhoItem[]>([]);

  const load = async () => {
    if (!user) return;
    const [s, m, d] = await Promise.all([
      performanceRepository.getStreak(user.id),
      performanceRepository.getMetaHoje(user.id),
      performanceRepository.getDesempenhoPorDisciplina(user.id),
    ]);
    setStreak(s);
    setMeta(m);
    setFraquezas(d.slice(0, 3));
  };

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const questoesProgress = Math.min(1, meta.questoes_respondidas / meta.meta_questoes);
  const minutosProgress = Math.min(1, meta.minutos_estudados / meta.meta_minutos);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting} 👋</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.nome ?? 'Estudante'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: Colors.primary }]}>
          <View>
            <Text style={styles.streakLabel}>Sequência atual</Text>
            <Text style={styles.streakValue}>{streak.streak_atual} dias 🔥</Text>
            <Text style={styles.streakRecord}>Recorde: {streak.streak_maximo} dias</Text>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakEmoji}>
              {streak.streak_atual >= 30 ? '🏆' : streak.streak_atual >= 7 ? '⭐' : '💪'}
            </Text>
          </View>
        </View>

        {/* Daily Goals */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meta do dia</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={{ fontSize: 20 }}>📝</Text>
              <View>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Questões</Text>
                <Text style={[styles.goalValue, { color: colors.textSecondary }]}>
                  {meta.questoes_respondidas}/{meta.meta_questoes}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.bgInput }]}>
              <View style={[styles.progressFill, { width: `${questoesProgress * 100}%`, backgroundColor: Colors.primary }]} />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={{ fontSize: 20 }}>⏱️</Text>
              <View>
                <Text style={[styles.goalLabel, { color: colors.text }]}>Minutos</Text>
                <Text style={[styles.goalValue, { color: colors.textSecondary }]}>
                  {meta.minutos_estudados}/{meta.meta_minutos}
                </Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.bgInput }]}>
              <View style={[styles.progressFill, { width: `${minutosProgress * 100}%`, backgroundColor: Colors.success }]} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ações rápidas</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '📝', label: 'Questões', route: '/(tabs)/questoes', color: '#3B82F6' },
            { icon: '⏱️', label: 'Foco', route: '/(tabs)/foco', color: '#8B5CF6' },
            { icon: '🃏', label: 'Flashcards', route: '/flashcards', color: '#22C55E' },
            { icon: '✍️', label: 'Redação', route: '/redacao', color: '#F59E0B' },
            { icon: '📊', label: 'Stats', route: '/(tabs)/desempenho', color: '#EF4444' },
            { icon: '🎯', label: 'Simulado', route: '/simulado', color: '#06B6D4' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Text style={{ fontSize: 22 }}>{action.icon}</Text>
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trainer Alerts */}
        {fraquezas.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Modo Treinador</Text>
            <View style={[styles.trainerCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Text style={styles.trainerTitle}>⚠️ Pontos de atenção</Text>
              {fraquezas.map((f) => {
                const subject = SUBJECTS.find(s => s.id === f.disciplina);
                return (
                  <Text key={f.disciplina} style={styles.trainerText}>
                    • {subject?.label ?? f.disciplina}: {f.taxa_acerto?.toFixed(0) ?? 0}% de acerto
                  </Text>
                );
              })}
              <Text style={[styles.trainerHint]}>
                Dedique mais tempo a essas disciplinas hoje!
              </Text>
            </View>
          </>
        )}

        {/* Subjects Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Disciplinas</Text>
        <View style={styles.subjectsGrid}>
          {SUBJECTS.slice(0, 8).map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[styles.subjectBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={styles.subjectIcon}>{subject.icon}</Text>
              <Text style={[styles.subjectLabel, { color: colors.text }]} numberOfLines={2}>
                {subject.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: { fontSize: Typography.fontSize.sm, fontWeight: '500' },
  userName: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.fontSize.sm, fontWeight: '500' },
  streakValue: { color: '#fff', fontSize: Typography.fontSize['2xl'], fontWeight: '900', marginVertical: 2 },
  streakRecord: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.fontSize.xs },
  streakRight: {},
  streakEmoji: { fontSize: 48 },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 120,
  },
  goalLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  goalValue: { fontSize: Typography.fontSize.xs },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  divider: { height: 1, marginVertical: Spacing.sm },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  actionBtn: {
    width: '31%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: Typography.fontSize.xs, fontWeight: '600', textAlign: 'center' },
  trainerCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  trainerTitle: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: '#92400E', marginBottom: Spacing.xs },
  trainerText: { fontSize: Typography.fontSize.sm, color: '#78350F', marginVertical: 2 },
  trainerHint: { fontSize: Typography.fontSize.xs, color: '#B45309', marginTop: Spacing.xs, fontStyle: 'italic' },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  subjectBtn: {
    width: '23%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 72,
    justifyContent: 'center',
  },
  subjectIcon: { fontSize: 22 },
  subjectLabel: { fontSize: 9, fontWeight: '500', textAlign: 'center' },
});