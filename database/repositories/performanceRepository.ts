// database/repositories/performanceRepository.ts
import { getDatabase } from "../database";

export interface DesempenhoItem {
  disciplina: string;
  total_acertos: number;
  total_erros: number;
  total_questoes: number;
  taxa_acerto: number;
  nota_estimada: number;
  tempo_total_minutos: number;
}

export interface StreakData {
  streak_atual: number;
  streak_maximo: number;
  ultima_atividade: string;
}

export const performanceRepository = {
  async getDesempenhoPorDisciplina(userId: number): Promise<DesempenhoItem[]> {
    const db = await getDatabase();
    return db.getAllAsync<DesempenhoItem>(
      `
      SELECT 
        disciplina,
        SUM(acertos) as total_acertos,
        SUM(erros) as total_erros,
        SUM(acertos + erros) as total_questoes,
        ROUND(CAST(SUM(acertos) AS REAL) / NULLIF(SUM(acertos + erros), 0) * 100, 1) as taxa_acerto,
        ROUND(CAST(SUM(acertos) AS REAL) / NULLIF(SUM(acertos + erros), 0) * 1000, 0) as nota_estimada,
        SUM(tempo_estudo_minutos) as tempo_total_minutos
      FROM desempenho 
      WHERE usuario_id = ?
      GROUP BY disciplina
      ORDER BY taxa_acerto ASC
    `,
      [userId],
    );
  },

  async registrarResposta(
    userId: number,
    questaoId: number,
    disciplina: string,
    correta: boolean,
    tempoSegundos: number,
  ): Promise<void> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];

    // Update or insert performance record
    const existing = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM desempenho WHERE usuario_id = ? AND disciplina = ? AND data = ?",
      [userId, disciplina, today],
    );

    if (existing) {
      await db.runAsync(
        `UPDATE desempenho SET 
          acertos = acertos + ?,
          erros = erros + ?,
          tempo_estudo_minutos = tempo_estudo_minutos + ?
        WHERE id = ?`,
        [
          correta ? 1 : 0,
          correta ? 0 : 1,
          Math.round(tempoSegundos / 60),
          existing.id,
        ],
      );
    } else {
      await db.runAsync(
        "INSERT INTO desempenho (usuario_id, disciplina, acertos, erros, tempo_estudo_minutos) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          disciplina,
          correta ? 1 : 0,
          correta ? 0 : 1,
          Math.round(tempoSegundos / 60),
        ],
      );
    }

    // Update spaced repetition
    await this.updateSpacedRepetition(userId, questaoId, correta);

    // Update streak
    await this.updateStreak(userId);
  },

  async updateSpacedRepetition(
    userId: number,
    questaoId: number,
    correta: boolean,
  ): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{
      id: number;
      intervalo_dias: number;
      facilidade: number;
    }>(
      "SELECT id, intervalo_dias, facilidade FROM respostas_usuario WHERE usuario_id = ? AND questao_id = ? ORDER BY id DESC LIMIT 1",
      [userId, questaoId],
    );

    let intervalo = 1;
    let facilidade = 2.5;

    if (existing) {
      facilidade = existing.facilidade;
      if (correta) {
        if (existing.intervalo_dias === 1) intervalo = 6;
        else intervalo = Math.round(existing.intervalo_dias * facilidade);
        facilidade = Math.max(1.3, facilidade + 0.1);
      } else {
        intervalo = 1;
        facilidade = Math.max(1.3, facilidade - 0.2);
      }
    }

    const proximaRevisao = new Date();
    proximaRevisao.setDate(proximaRevisao.getDate() + intervalo);

    await db.runAsync(
      `INSERT INTO respostas_usuario 
        (usuario_id, questao_id, correta, revisao_espacada, proxima_revisao, intervalo_dias, facilidade)
       VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [
        userId,
        questaoId,
        correta ? 1 : 0,
        proximaRevisao.toISOString().split("T")[0],
        intervalo,
        facilidade,
      ],
    );
  },

  async getQuestoesParaRevisar(userId: number): Promise<number[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];
    const results = await db.getAllAsync<{ questao_id: number }>(
      `SELECT DISTINCT questao_id FROM respostas_usuario 
       WHERE usuario_id = ? AND proxima_revisao <= ? AND revisao_espacada = 1`,
      [userId, today],
    );
    return results.map((r) => r.questao_id);
  },

  async getStreak(userId: number): Promise<StreakData> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<StreakData>(
      "SELECT streak_atual, streak_maximo, ultima_atividade FROM streak WHERE usuario_id = ?",
      [userId],
    );
    return (
      result ?? { streak_atual: 0, streak_maximo: 0, ultima_atividade: "" }
    );
  },

  async updateStreak(userId: number): Promise<void> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const streak = await db.getFirstAsync<StreakData>(
      "SELECT * FROM streak WHERE usuario_id = ?",
      [userId],
    );

    if (!streak) {
      await db.runAsync(
        "INSERT INTO streak (usuario_id, streak_atual, streak_maximo, ultima_atividade) VALUES (?, 1, 1, ?)",
        [userId, today],
      );
      return;
    }

    if (streak.ultima_atividade === today) return; // Already updated today

    let novoStreak = streak.streak_atual;
    if (streak.ultima_atividade === yesterdayStr) {
      novoStreak += 1;
    } else {
      novoStreak = 1; // Streak broken
    }

    await db.runAsync(
      "UPDATE streak SET streak_atual = ?, streak_maximo = MAX(streak_maximo, ?), ultima_atividade = ? WHERE usuario_id = ?",
      [novoStreak, novoStreak, today, userId],
    );
  },

  async getMetaHoje(
    userId: number,
  ): Promise<{
    questoes_respondidas: number;
    minutos_estudados: number;
    meta_questoes: number;
    meta_minutos: number;
  }> {
    const db = await getDatabase();
    const today = new Date().toISOString().split("T")[0];
    const meta = await db.getFirstAsync<any>(
      "SELECT * FROM metas WHERE usuario_id = ? AND data = ?",
      [userId, today],
    );

    if (!meta) {
      const config = await db.getFirstAsync<{ meta_diaria_minutos: number }>(
        "SELECT meta_diaria_minutos FROM configuracoes WHERE usuario_id = ?",
        [userId],
      );
      await db.runAsync(
        "INSERT INTO metas (usuario_id, data, meta_questoes, meta_minutos) VALUES (?, ?, 20, ?)",
        [userId, today, config?.meta_diaria_minutos ?? 120],
      );
      return {
        questoes_respondidas: 0,
        minutos_estudados: 0,
        meta_questoes: 20,
        meta_minutos: config?.meta_diaria_minutos ?? 120,
      };
    }
    return meta;
  },
};
