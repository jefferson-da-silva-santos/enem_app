// app/(tabs)/desempenho.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, SUBJECTS, Typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  DesempenhoItem,
  performanceRepository,
  StreakData,
} from '../../database/repositories/performanceRepository';

type Period = '7d' | '30d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  all: 'Total',
};

interface SummaryStats {
  totalQuestoes: number;
  totalAcertos: number;
  totalMinutos: number;
  mediaGeral: number;
  notaEstimada: number;
}

export default function DesempenhoScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [desempenho, setDesempenho] = useState<DesempenhoItem[]>([]);
  const [streak, setStreak] = useState<StreakData>({
    streak_atual: 0,
    streak_maximo: 0,
    ultima_atividade: '',
  });
  const [summary, setSummary] = useState<SummaryStats>({
    totalQuestoes: 0,
    totalAcertos: 0,
    totalMinutos: 0,
    mediaGeral: 0,
    notaEstimada: 0,
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [d, s] = await Promise.all([
      performanceRepository.getDesempenhoPorDisciplina(user.id),
      performanceRepository.getStreak(user.id),
    ]);
    setDesempenho(d);
    setStreak(s);

    const totalQuestoes = d.reduce((acc, i) => acc + (i.total_questoes ?? 0), 0);
    const totalAcertos = d.reduce((acc, i) => acc + (i.total_acertos ?? 0), 0);
    const totalMinutos = d.reduce((acc, i) => acc + (i.tempo_total_minutos ?? 0), 0);
    const mediaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;
    const notaEstimada = (mediaGeral / 100) * 1000;

    setSummary({ totalQuestoes, totalAcertos, totalMinutos, mediaGeral, notaEstimada });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getSubjectInfo = (disciplina: string) =>
    SUBJECTS.find((s) => s.id === disciplina);

  const getPerformanceColor = (taxa: number) => {
    if (taxa >= 70) return Colors.success;
    if (taxa >= 50) return Colors.warning;
    return Colors.error;
  };

  const getPerformanceLabel = (taxa: number) => {
    if (taxa >= 70) return 'Bom';
    if (taxa >= 50) return 'Regular';
    return 'Fraco';
  };

  const sortedDesempenho = [...desempenho].sort(
    (a, b) => (b.taxa_acerto ?? 0) - (a.taxa_acerto ?? 0),
  );

  const weakSubjects = desempenho
    .filter((d) => (d.taxa_acerto ?? 0) < 50)
    .sort((a, b) => (a.taxa_acerto ?? 0) - (b.taxa_acerto ?? 0))
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Desempenho</Text>
        <View style={[styles.periodSelector, { backgroundColor: colors.bgInput }]}>
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                period === p && { backgroundColor: Colors.primary },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p ? '#fff' : colors.textSecondary },
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          color={Colors.primary}
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Questões"
              value={String(summary.totalQuestoes)}
              icon="📝"
              color={Colors.primary}
              colors={colors}
            />
            <SummaryCard
              label="Acertos"
              value={`${summary.mediaGeral.toFixed(0)}%`}
              icon="✅"
              color={Colors.success}
              colors={colors}
            />
            <SummaryCard
              label="Minutos"
              value={String(summary.totalMinutos)}
              icon="⏱️"
              color={Colors.warning}
              colors={colors}
            />
            <SummaryCard
              label="Nota Est."
              value={summary.notaEstimada.toFixed(0)}
              icon="🎯"
              color="#8B5CF6"
              colors={colors}
            />
          </View>

          {/* Streak */}
          <View style={[styles.streakRow, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40', borderWidth: 1, borderRadius: Radius.lg }]}>
            <View>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Sequência atual</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>
                🔥 {streak.streak_atual} dias
              </Text>
            </View>
            <View style={styles.streakRight}>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Recorde</Text>
              <Text style={[styles.streakMaxValue, { color: Colors.primary }]}>
                ⭐ {streak.streak_maximo} dias
              </Text>
            </View>
          </View>

          {/* Weak Subjects Alert */}
          {weakSubjects.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ⚠️ Pontos de atenção
              </Text>
              <View
                style={[
                  styles.alertCard,
                  { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                ]}
              >
                {weakSubjects.map((item) => {
                  const subject = getSubjectInfo(item.disciplina);
                  return (
                    <View key={item.disciplina} style={styles.alertRow}>
                      <Text style={{ fontSize: 16 }}>{subject?.icon ?? '📚'}</Text>
                      <Text style={styles.alertText}>
                        {subject?.label ?? item.disciplina}
                      </Text>
                      <Text style={styles.alertBadge}>
                        {(item.taxa_acerto ?? 0).toFixed(0)}%
                      </Text>
                    </View>
                  );
                })}
                <Text style={styles.alertHint}>
                  Dedique mais tempo a essas disciplinas!
                </Text>
              </View>
            </>
          )}

          {/* Performance by Subject */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Por disciplina
          </Text>

          {sortedDesempenho.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📊</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Responda questões para ver seu desempenho aqui.
              </Text>
            </View>
          ) : (
            sortedDesempenho.map((item) => {
              const subject = getSubjectInfo(item.disciplina);
              const taxa = item.taxa_acerto ?? 0;
              const perfColor = getPerformanceColor(taxa);
              const perfLabel = getPerformanceLabel(taxa);

              return (
                <View
                  key={item.disciplina}
                  style={[
                    styles.subjectCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectInfo}>
                      <View
                        style={[
                          styles.subjectIconBg,
                          { backgroundColor: (subject?.color ?? Colors.primary) + '20' },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{subject?.icon ?? '📚'}</Text>
                      </View>
                      <View>
                        <Text style={[styles.subjectName, { color: colors.text }]}>
                          {subject?.label ?? item.disciplina}
                        </Text>
                        <Text style={[styles.subjectStats, { color: colors.textSecondary }]}>
                          {item.total_acertos ?? 0} acertos · {item.total_questoes ?? 0} questões
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.perfBadge,
                        { backgroundColor: perfColor + '20' },
                      ]}
                    >
                      <Text style={[styles.perfBadgeText, { color: perfColor }]}>
                        {perfLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.barRow}>
                    <View
                      style={[styles.barTrack, { backgroundColor: colors.bgInput }]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.min(100, taxa)}%` as any,
                            backgroundColor: perfColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: perfColor }]}>
                      {taxa.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Estimated Score */}
                  <View style={styles.noteRow}>
                    <Text style={[styles.noteLabel, { color: colors.textMuted }]}>
                      Nota estimada:
                    </Text>
                    <Text style={[styles.noteValue, { color: Colors.primary }]}>
                      {(item.nota_estimada ?? 0).toFixed(0)} / 1000
                    </Text>
                    <Text style={[styles.noteLabel, { color: colors.textMuted }]}>
                      · {item.tempo_total_minutos ?? 0} min estudados
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Overall estimated score */}
          {summary.totalQuestoes > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nota geral estimada
              </Text>
              <View
                style={[
                  styles.scoreCard,
                  { backgroundColor: Colors.primary, borderRadius: Radius.xl },
                ]}
              >
                <Text style={styles.scoreLabel}>Com base no seu desempenho atual</Text>
                <Text style={styles.scoreValue}>
                  {summary.notaEstimada.toFixed(0)}
                </Text>
                <Text style={styles.scoreMax}>de 1000 pontos</Text>
                <View style={styles.scoreBarTrack}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      { width: `${(summary.notaEstimada / 1000) * 100}%` as any },
                    ]}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={[
        summaryStyles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
    >
      <View style={[summaryStyles.iconBg, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[summaryStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[summaryStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 90,
    justifyContent: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  periodText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    marginBottom: Spacing.xs,
  },
  streakRight: { alignItems: 'flex-end' },
  streakLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  streakValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  streakMaxValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  alertCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#92400E',
  },
  alertBadge: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.error,
  },
  alertHint: {
    fontSize: Typography.fontSize.xs,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  subjectCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  subjectIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  subjectStats: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  perfBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  perfBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteLabel: {
    fontSize: Typography.fontSize.xs,
  },
  noteValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  scoreCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  scoreMax: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.sm,
  },
  scoreBarTrack: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.base,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
});