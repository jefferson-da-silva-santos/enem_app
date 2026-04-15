// database/repositories/userRepository.ts
import { getDatabase } from "../database";
import CryptoJS from "crypto-js";

export interface Usuario {
  id: number;
  nome: string | null;
  pin_hash: string;
  created_at: string;
}

export interface Configuracao {
  id: number;
  usuario_id: number;
  tema: string;
  notificacoes: number;
  horario_estudo: string;
  meta_diaria_minutos: number;
  data_prova: string | null;
  nivel_atual: string;
}

function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin + "enem_salt_2024").toString();
}

export const userRepository = {
  async hasUser(): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM usuarios",
    );
    return (result?.count ?? 0) > 0;
  },

  async createUser(pin: string, nome?: string): Promise<number> {
    const db = await getDatabase();
    const pinHash = hashPin(pin);
    const result = await db.runAsync(
      "INSERT INTO usuarios (nome, pin_hash) VALUES (?, ?)",
      [nome ?? null, pinHash],
    );
    const userId = result.lastInsertRowId;

    // Create default settings
    await db.runAsync("INSERT INTO configuracoes (usuario_id) VALUES (?)", [
      userId,
    ]);

    // Initialize streak
    await db.runAsync("INSERT INTO streak (usuario_id) VALUES (?)", [userId]);

    return userId;
  },

  async validatePin(pin: string): Promise<Usuario | null> {
    const db = await getDatabase();
    const pinHash = hashPin(pin);
    const user = await db.getFirstAsync<Usuario>(
      "SELECT * FROM usuarios WHERE pin_hash = ? LIMIT 1",
      [pinHash],
    );
    return user ?? null;
  },

  async updatePin(
    userId: number,
    currentPin: string,
    newPin: string,
  ): Promise<boolean> {
    const db = await getDatabase();
    const currentHash = hashPin(currentPin);
    const user = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM usuarios WHERE id = ? AND pin_hash = ?",
      [userId, currentHash],
    );
    if (!user) return false;

    const newHash = hashPin(newPin);
    await db.runAsync(
      'UPDATE usuarios SET pin_hash = ?, updated_at = datetime("now") WHERE id = ?',
      [newHash, userId],
    );
    return true;
  },

  async resetPinAndData(pin: string): Promise<number> {
    const db = await getDatabase();
    // Clear all user data
    await db.execAsync(`
      DELETE FROM respostas_usuario;
      DELETE FROM desempenho;
      DELETE FROM sessoes_foco;
      DELETE FROM flashcards;
      DELETE FROM redacoes;
      DELETE FROM metas;
      DELETE FROM streak;
      DELETE FROM simulados;
      DELETE FROM cronograma;
      DELETE FROM configuracoes;
      DELETE FROM usuarios;
    `);
    return this.createUser(pin);
  },

  async getUser(): Promise<Usuario | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Usuario>("SELECT * FROM usuarios LIMIT 1");
  },

  async getConfig(userId: number): Promise<Configuracao | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Configuracao>(
      "SELECT * FROM configuracoes WHERE usuario_id = ?",
      [userId],
    );
  },

  async updateConfig(
    userId: number,
    updates: Partial<Configuracao>,
  ): Promise<void> {
    const db = await getDatabase();
    const fields = Object.keys(updates)
      .filter((k) => k !== "id" && k !== "usuario_id")
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.entries(updates)
      .filter(([k]) => k !== "id" && k !== "usuario_id")
      .map(([, v]) => v);
    await db.runAsync(
      `UPDATE configuracoes SET ${fields} WHERE usuario_id = ?`,
      [...values, userId],
    );
  },
};
