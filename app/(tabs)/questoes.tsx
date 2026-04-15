// app/(tabs)/questoes.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDatabase } from '../../database/database';
import { performanceRepository } from '../../database/repositories/performanceRepository';
import { Colors, Spacing, Typography, Radius, SUBJECTS } from '../../constants/theme';

interface Questao {
  id: number;
  disciplina: string;
  topico: string;
  ano: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  explicacao: string;
  dificuldade: string;
}

const ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E'] as const;

export default function QuestoesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [resposta, setResposta] = useState<string | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ acertos: 0, erros: 0, total: 0 });
  const [startTime, setStartTime] = useState<number>(Date.now());

  const loadQuestao = useCallback(async () => {
    setLoading(true);
    setResposta(null);
    setMostrarExplicacao(false);
    const db = await getDatabase();
    let query = 'SELECT * FROM questoes';
    const params: any[] = [];
    if (selectedFilter) {
      query += ' WHERE disciplina = ?';
      params.push(selectedFilter);
    }
    query += ' ORDER BY RANDOM() LIMIT 1';
    const q = await db.getFirstAsync<Questao>(query, params);
    setQuestao(q ?? null);
    setStartTime(Date.now());
    setLoading(false);
  }, [selectedFilter]);

  useEffect(() => { loadQuestao(); }, [selectedFilter]);

  const handleAnswer = async (alt: string) => {
    if (resposta || !questao || !user) return;
    setResposta(alt);
    setMostrarExplicacao(true);
    const correta = alt === questao.resposta_correta;
    const tempo = Math.round((Date.now() - startTime) / 1000);

    await performanceRepository.registrarResposta(
      user.id,
      questao.id,
      questao.disciplina,
      correta,
      tempo
    );

    setStats(s => ({
      acertos: s.acertos + (correta ? 1 : 0),
      erros: s.erros + (correta ? 0 : 1),
      total: s.total + 1,
    }));
  };

  const getAltText = (questao: Questao, alt: string) => {
    const map: Record<string, string> = {
      A: questao.alternativa_a,
      B: questao.alternativa_b,
      C: questao.alternativa_c,
      D: questao.alternativa_d,
      E: questao.alternativa_e,
    };
    return map[alt];
  };

  const getAltStyle = (alt: string) => {
    if (!resposta) return [styles.altBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }];
    if (alt === questao?.resposta_correta)
      return [styles.altBtn, { backgroundColor: '#DCFCE7', borderColor: Colors.success }];
    if (alt === resposta && resposta !== questao?.resposta_correta)
      return [styles.altBtn, { backgroundColor: '#FEE2E2', borderColor: Colors.error }];
    return [styles.altBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, opacity: 0.5 }];
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Banco de Questões</Text>
        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: Colors.success }]}>✓ {stats.acertos}</Text>
          <Text style={[styles.stat, { color: Colors.error }]}>✗ {stats.erros}</Text>
          <Text style={[styles.stat, { color: colors.textSecondary }]}>= {stats.total}</Text>
        </View>
      </View>

      {/* Subject Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: !selectedFilter ? Colors.primary : colors.bgCard, borderColor: !selectedFilter ? Colors.primary : colors.border }]}
            onPress={() => setSelectedFilter(null)}
          >
            <Text style={[styles.filterText, { color: !selectedFilter ? '#fff' : colors.text }]}>Todas</Text>
          </TouchableOpacity>
          {SUBJECTS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.filterChip, {
                backgroundColor: selectedFilter === s.id ? Colors.primary : colors.bgCard,
                borderColor: selectedFilter === s.id ? Colors.primary : colors.border,
              }]}
              onPress={() => setSelectedFilter(s.id)}
            >
              <Text style={{ fontSize: 12 }}>{s.icon}</Text>
              <Text style={[styles.filterText, { color: selectedFilter === s.id ? '#fff' : colors.text }]}>
                {s.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Question */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : questao ? (
          <>
            <View style={[styles.questionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.questionMeta}>
                <View style={[styles.badge, { backgroundColor: Colors.primary + '20' }]}>
                  <Text style={[styles.badgeText, { color: Colors.primary }]}>
                    {SUBJECTS.find(s => s.id === questao.disciplina)?.label ?? questao.disciplina}
                  </Text>
                </View>
                {questao.ano && (
                  <View style={[styles.badge, { backgroundColor: colors.bgInput }]}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>ENEM {questao.ano}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.questionText, { color: colors.text }]}>{questao.enunciado}</Text>
            </View>

            {/* Alternatives */}
            <View style={styles.alternatives}>
              {ALTERNATIVAS.map(alt => (
                <TouchableOpacity
                  key={alt}
                  style={getAltStyle(alt)}
                  onPress={() => handleAnswer(alt)}
                  disabled={!!resposta}
                  activeOpacity={0.7}
                >
                  <View style={[styles.altLetter, {
                    backgroundColor: resposta
                      ? alt === questao.resposta_correta ? Colors.success
                        : alt === resposta ? Colors.error : colors.bgInput
                      : Colors.primary
                  }]}>
                    <Text style={styles.altLetterText}>{alt}</Text>
                  </View>
                  <Text style={[styles.altText, { color: colors.text }]} numberOfLines={4}>
                    {getAltText(questao, alt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Explanation */}
            {mostrarExplicacao && questao.explicacao && (
              <View style={[styles.explanation, {
                backgroundColor: resposta === questao.resposta_correta ? '#DCFCE7' : '#FEE2E2',
                borderColor: resposta === questao.resposta_correta ? Colors.success : Colors.error,
              }]}>
                <Text style={styles.explanationTitle}>
                  {resposta === questao.resposta_correta ? '✅ Correto!' : '❌ Incorreto'}
                </Text>
                <Text style={styles.explanationText}>{questao.explicacao}</Text>
              </View>
            )}

            {/* Next */}
            {resposta && (
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.primary }]} onPress={loadQuestao}>
                <Text style={styles.nextBtnText}>Próxima questão →</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma questão encontrada para este filtro.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  filterScroll: { maxHeight: 52, flexGrow: 0 },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },
  questionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  questionMeta: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  questionText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
    fontWeight: '400',
  },
  alternatives: { gap: Spacing.sm, marginBottom: Spacing.base },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  altLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  altLetterText: { color: '#fff', fontSize: Typography.fontSize.sm, fontWeight: '800' },
  altText: { flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20 },
  explanation: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  explanationTitle: { fontSize: Typography.fontSize.md, fontWeight: '700', color: '#064E3B', marginBottom: Spacing.xs },
  explanationText: { fontSize: Typography.fontSize.sm, color: '#065F46', lineHeight: 20 },
  nextBtn: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  nextBtnText: { color: '#fff', fontSize: Typography.fontSize.md, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.base },
  emptyText: { fontSize: Typography.fontSize.base, textAlign: 'center' },
});