// database/database.ts
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("enem_prep.db");
    await initializeDatabase(db);
  }
  return db;
}

export async function initializeDatabase(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Users & Security
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      pin_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      tema TEXT DEFAULT 'system',
      notificacoes INTEGER DEFAULT 1,
      horario_estudo TEXT DEFAULT '08:00',
      meta_diaria_minutos INTEGER DEFAULT 120,
      data_prova TEXT,
      nivel_atual TEXT DEFAULT 'intermediario',
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Study Planning
    CREATE TABLE IF NOT EXISTS cronograma (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      data TEXT NOT NULL,
      disciplina TEXT NOT NULL,
      topico TEXT,
      duracao_minutos INTEGER DEFAULT 30,
      concluido INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Questions Bank
    CREATE TABLE IF NOT EXISTS questoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disciplina TEXT NOT NULL,
      topico TEXT,
      ano INTEGER,
      enunciado TEXT NOT NULL,
      alternativa_a TEXT NOT NULL,
      alternativa_b TEXT NOT NULL,
      alternativa_c TEXT NOT NULL,
      alternativa_d TEXT NOT NULL,
      alternativa_e TEXT NOT NULL,
      resposta_correta TEXT NOT NULL,
      explicacao TEXT,
      dificuldade TEXT DEFAULT 'medio',
      tags TEXT
    );

    -- User Answers
    CREATE TABLE IF NOT EXISTS respostas_usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      questao_id INTEGER,
      resposta TEXT,
      correta INTEGER,
      tempo_segundos INTEGER,
      data_resposta TEXT DEFAULT (datetime('now')),
      revisao_espacada INTEGER DEFAULT 0,
      proxima_revisao TEXT,
      intervalo_dias INTEGER DEFAULT 1,
      facilidade REAL DEFAULT 2.5,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (questao_id) REFERENCES questoes(id)
    );

    -- Performance
    CREATE TABLE IF NOT EXISTS desempenho (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      disciplina TEXT NOT NULL,
      data TEXT DEFAULT (date('now')),
      acertos INTEGER DEFAULT 0,
      erros INTEGER DEFAULT 0,
      tempo_estudo_minutos INTEGER DEFAULT 0,
      nota_estimada REAL DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Focus Sessions
    CREATE TABLE IF NOT EXISTS sessoes_foco (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      inicio TEXT DEFAULT (datetime('now')),
      fim TEXT,
      duracao_minutos INTEGER,
      tipo TEXT DEFAULT 'pomodoro',
      disciplina TEXT,
      concluida INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Flashcards
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      disciplina TEXT NOT NULL,
      frente TEXT NOT NULL,
      verso TEXT NOT NULL,
      dificuldade INTEGER DEFAULT 0,
      proxima_revisao TEXT DEFAULT (date('now')),
      intervalo_dias INTEGER DEFAULT 1,
      facilidade REAL DEFAULT 2.5,
      total_revisoes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Essays
    CREATE TABLE IF NOT EXISTS redacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      tema TEXT NOT NULL,
      introducao TEXT,
      desenvolvimento1 TEXT,
      desenvolvimento2 TEXT,
      conclusao TEXT,
      texto_completo TEXT,
      nota_competencia1 INTEGER DEFAULT 0,
      nota_competencia2 INTEGER DEFAULT 0,
      nota_competencia3 INTEGER DEFAULT 0,
      nota_competencia4 INTEGER DEFAULT 0,
      nota_competencia5 INTEGER DEFAULT 0,
      nota_total INTEGER DEFAULT 0,
      feedback TEXT,
      status TEXT DEFAULT 'rascunho',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Goals & Streaks
    CREATE TABLE IF NOT EXISTS metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      data TEXT DEFAULT (date('now')),
      meta_questoes INTEGER DEFAULT 20,
      meta_minutos INTEGER DEFAULT 120,
      questoes_respondidas INTEGER DEFAULT 0,
      minutos_estudados INTEGER DEFAULT 0,
      concluida INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS streak (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      streak_atual INTEGER DEFAULT 0,
      streak_maximo INTEGER DEFAULT 0,
      ultima_atividade TEXT DEFAULT (date('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Simulations
    CREATE TABLE IF NOT EXISTS simulados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      titulo TEXT,
      tipo TEXT DEFAULT 'completo',
      inicio TEXT,
      fim TEXT,
      tempo_segundos INTEGER DEFAULT 18000,
      status TEXT DEFAULT 'pendente',
      nota_total REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS simulado_questoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      simulado_id INTEGER,
      questao_id INTEGER,
      resposta_usuario TEXT,
      correta INTEGER,
      FOREIGN KEY (simulado_id) REFERENCES simulados(id),
      FOREIGN KEY (questao_id) REFERENCES questoes(id)
    );
  `);

  // Seed sample questions if empty
  const count = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM questoes",
  );
  if (count?.count === 0) {
    await seedSampleQuestions(database);
  }
}

async function seedSampleQuestions(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    INSERT INTO questoes (disciplina, topico, ano, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, resposta_correta, explicacao, dificuldade) VALUES
    ('matematica', 'Funções', 2023, 'Uma função f(x) = 2x + 3 é dada. Qual o valor de f(5)?', '10', '11', '13', '15', '16', 'C', 'f(5) = 2(5) + 3 = 10 + 3 = 13', 'facil'),
    ('portugues', 'Interpretação de Texto', 2023, 'Qual figura de linguagem está presente em "O tempo voa"?', 'Metonímia', 'Metáfora', 'Hipérbole', 'Ironia', 'Eufemismo', 'B', 'A expressão "o tempo voa" atribui ao tempo (abstrato) a característica de voar (concreto), caracterizando a metáfora.', 'facil'),
    ('historia', 'Brasil Colonial', 2022, 'O Sistema de Capitanias Hereditárias foi instituído em qual período?', 'Período Pombalino', 'Período Colonial Tardio', 'Primeiro Reinado', 'Período de colonização inicial', 'Período Regencial', 'D', 'As Capitanias Hereditárias foram instituídas em 1532, na fase inicial da colonização portuguesa no Brasil.', 'medio'),
    ('fisica', 'Cinemática', 2023, 'Um carro parte do repouso e acelera uniformemente a 2 m/s². Qual sua velocidade após 5 segundos?', '5 m/s', '7 m/s', '10 m/s', '12 m/s', '15 m/s', 'C', 'Usando v = v0 + at: v = 0 + 2×5 = 10 m/s', 'facil'),
    ('biologia', 'Ecologia', 2022, 'Qual alternativa representa corretamente uma cadeia alimentar?', 'Leão → Zebra → Capim', 'Capim → Zebra → Leão', 'Zebra → Capim → Leão', 'Leão → Capim → Zebra', 'Capim → Leão → Zebra', 'B', 'Em uma cadeia alimentar, os produtores (plantas) vêm primeiro, seguidos pelos consumidores primários e depois pelos secundários.', 'facil');
  `);
}
