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
  // Inserindo em lotes para evitar queries muito longas
  await db.execAsync(`
    INSERT INTO questoes (disciplina, topico, ano, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, resposta_correta, explicacao, dificuldade) VALUES

    -- ===================== MATEMÁTICA =====================
    ('matematica', 'Funções', 2023, 'Uma função f(x) = 2x + 3 é dada. Qual o valor de f(5)?', '10', '11', '13', '15', '16', 'C', 'f(5) = 2(5) + 3 = 10 + 3 = 13', 'facil'),
    ('matematica', 'Probabilidade', 2023, 'Uma urna contém 4 bolas pretas e 6 bolas brancas. Retirando-se uma bola ao acaso, qual a probabilidade de ser preta?', '1/4', '2/5', '3/5', '1/5', '1/2', 'B', 'P = 4/10 = 2/5. Há 4 bolas pretas em um total de 10 bolas.', 'facil'),
    ('matematica', 'Geometria Espacial', 2022, 'Um casal planeja construir uma piscina com formato de paralelepípedo com capacidade para 90.000 L de água. Sabendo que 1 m³ = 1.000 L, qual o volume em m³?', '9 m³', '90 m³', '900 m³', '9.000 m³', '0,9 m³', 'B', '90.000 L ÷ 1.000 = 90 m³', 'facil'),
    ('matematica', 'Funções', 2022, 'O gerente de uma loja percebeu que as vendas do Produto I cresciam 50 unidades por mês, enquanto as do Produto II cresciam 30 unidades. Se em abril o Produto I vendeu 200 e o Produto II vendeu 260, em qual mês o Produto I superará o Produto II?', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'B', 'Diferença inicial: 60 unidades. O Produto I ganha 20 por mês sobre o II. Após 3 meses (julho), I = 350 e II = 350, em agosto I supera II.', 'medio'),
    ('matematica', 'Estatística', 2023, 'Uma empresa tem 160 motoristas. O gráfico mostra: 20 fizeram 1 viagem, 40 fizeram 2 viagens, 60 fizeram 3 viagens e 40 fizeram 4 viagens. Qual a média de viagens por motorista?', '2,5', '2,75', '3,0', '2,25', '3,25', 'B', 'Média = (20×1 + 40×2 + 60×3 + 40×4) / 160 = (20+80+180+160)/160 = 440/160 = 2,75', 'medio'),
    ('matematica', 'Progressão Aritmética', 2021, 'Em uma PA, o primeiro termo é 3 e a razão é 4. Qual é o 10º termo?', '37', '39', '41', '43', '45', 'B', 'a10 = a1 + (n-1)r = 3 + 9×4 = 3 + 36 = 39', 'facil'),
    ('matematica', 'Geometria Plana', 2022, 'Um terreno retangular tem 20 m de comprimento e 15 m de largura. Qual a área desse terreno?', '35 m²', '70 m²', '150 m²', '300 m²', '600 m²', 'D', 'Área = comprimento × largura = 20 × 15 = 300 m²', 'facil'),
    ('matematica', 'Trigonometria', 2021, 'Em um triângulo retângulo, o cateto oposto mede 3 e a hipotenusa mede 5. Qual o valor do seno do ângulo oposto ao cateto?', '0,4', '0,5', '0,6', '0,75', '0,8', 'C', 'sen(θ) = cateto oposto / hipotenusa = 3/5 = 0,6', 'facil'),
    ('matematica', 'Exponencial e Logaritmos', 2020, 'Uma população de bactérias dobra a cada hora. Se há 500 bactérias no início, quantas haverá após 4 horas?', '2.000', '4.000', '6.000', '8.000', '10.000', 'D', 'P = 500 × 2⁴ = 500 × 16 = 8.000 bactérias', 'medio'),
    ('matematica', 'Geometria Analítica', 2019, 'Qual a distância entre os pontos A(1, 2) e B(4, 6)?', '3', '4', '5', '6', '7', 'C', 'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5', 'facil'),
    ('matematica', 'Matrizes', 2020, 'Dada a matriz A = [[1,2],[3,4]], qual é o determinante de A?', '-2', '-1', '0', '1', '2', 'A', 'det(A) = 1×4 - 2×3 = 4 - 6 = -2', 'medio'),
    ('matematica', 'Sistemas Lineares', 2021, 'Resolva o sistema: x + y = 10 e x - y = 4. Qual é o valor de x?', '3', '5', '7', '8', '9', 'C', 'Somando as equações: 2x = 14, logo x = 7', 'facil'),
    ('matematica', 'Probabilidade', 2022, 'Um dado honesto é lançado. Qual a probabilidade de sair um número par?', '1/6', '1/3', '1/2', '2/3', '5/6', 'C', 'Números pares: {2, 4, 6} → 3 casos favoráveis em 6 possíveis. P = 3/6 = 1/2', 'facil'),
    ('matematica', 'Funções', 2019, 'Se f(x) = x² - 4x + 3, para qual valor de x a função se anula?', 'x = 1 e x = 3', 'x = -1 e x = -3', 'x = 1 e x = -3', 'x = 2 e x = 4', 'x = 0 e x = 3', 'A', 'Fatorando: f(x) = (x-1)(x-3) = 0 → x = 1 ou x = 3', 'medio'),
    ('matematica', 'Geometria Espacial', 2021, 'Um cilindro tem raio 3 cm e altura 10 cm. Qual o seu volume? (use π ≈ 3,14)', '282,6 cm³', '197,4 cm³', '300,0 cm³', '94,2 cm³', '565,2 cm³', 'A', 'V = π × r² × h = 3,14 × 9 × 10 = 282,6 cm³', 'medio'),
    ('matematica', 'Sequências e PA/PG', 2022, 'Em uma PG de razão 2, o primeiro termo é 3. Qual é o 5º termo?', '24', '36', '48', '60', '72', 'C', 'a5 = 3 × 2⁴ = 3 × 16 = 48', 'medio'),

    -- ===================== PORTUGUÊS =====================
    ('portugues', 'Interpretação de Texto', 2023, 'Qual figura de linguagem está presente em "O tempo voa"?', 'Metonímia', 'Metáfora', 'Hipérbole', 'Ironia', 'Eufemismo', 'B', 'A expressão "o tempo voa" atribui ao tempo (abstrato) a característica de voar (concreto), caracterizando a metáfora.', 'facil'),
    ('portugues', 'Gramática', 2020, 'Considerando as variantes linguísticas do português brasileiro, o chamado "R caipira" é uma inovação presente principalmente em quais regiões do Brasil?', 'Nordeste e Norte', 'Interior de SP e regiões ligadas às rotas dos bandeirantes', 'Litoral do Rio de Janeiro', 'Sul do Brasil exclusivamente', 'Amazônia', 'B', 'Linguistas associam o R caipira às rotas dos bandeirantes paulistas: interior de SP, MG, MT, MS, PR e partes do Sul.', 'medio'),
    ('portugues', 'Literatura', 2020, 'No trecho "Chiquito tinha quase trinta quando conheceu Mariana num baile de casamento", qual é o gênero literário predominante?', 'Lírico', 'Épico', 'Dramático', 'Narrativo/Prosa de ficção', 'Ensaístico', 'D', 'O trecho apresenta características da prosa de ficção narrativa: narrador, personagens, ação e ambientação.', 'facil'),
    ('portugues', 'Interpretação de Texto', 2019, 'No texto sobre "exposição parental exagerada" em redes sociais, o principal risco apontado pelos pesquisadores é:', 'A divulgação de dados bancários', 'O constrangimento futuro da criança ao ter sua privacidade exposta sem consentimento', 'A pirataria de conteúdo fotográfico', 'O vício em redes sociais pelos pais', 'A falta de interação real entre pais e filhos', 'B', 'O texto aponta que crianças com 11 ou 12 anos podem se sentir constrangidas por conteúdos publicados sem o seu consentimento quando eram pequenas.', 'medio'),
    ('portugues', 'Gramática', 2021, 'Assinale a alternativa que apresenta corretamente o uso da crase:', 'Vou a casa de Maria', 'Ela foi a praia ontem', 'Refiro-me à professora de história', 'Chegamos a tempo', 'Viajarei a São Paulo amanhã', 'C', 'A crase ocorre diante de substantivos femininos quando há fusão da preposição "a" com o artigo "a". "À professora" = a + a professora.', 'medio'),
    ('portugues', 'Literatura', 2022, 'A expressão "Quem herda, não rouba" no conto regionalista é classificada como:', 'Metáfora', 'Ditado popular/provérbio', 'Hipérbole', 'Eufemismo', 'Ironia', 'B', 'Ditados populares são frases de sabedoria criadas pelo povo, transmitidas oralmente entre gerações.', 'facil'),
    ('portugues', 'Interpretação de Texto', 2020, 'No texto "O importado vermelho de Noé", as repetições e frases curtas têm como principal função:', 'Dificultar a compreensão do leitor', 'Criar ritmo e revelar a obsessão e alienação do personagem', 'Indicar um defeito de escrita do autor', 'Mostrar a simplicidade do personagem', 'Descrever cenários detalhadamente', 'B', 'As repetições constroem um ritmo que expõe a mentalidade obcecada e alienada do narrador-personagem.', 'dificil'),
    ('portugues', 'Gramática', 2023, 'Qual a função sintática de "que" em "Ele disse que viria"?', 'Pronome relativo', 'Conjunção subordinativa integrante', 'Conjunção coordenativa', 'Pronome interrogativo', 'Artigo', 'B', '"Que" introduz uma oração subordinada substantiva objetiva direta, funcionando como conjunção subordinativa integrante.', 'medio'),
    ('portugues', 'Literatura', 2019, 'No poema "Menina" de Clarice Lispector, a interrupção do trabalho da mãe simboliza:', 'A ociosidade feminina', 'O momento de tensão e expectativa antes de uma pergunta difícil', 'A incompetência da mãe na costura', 'O fim da narrativa', 'A chegada de um visitante', 'B', 'A suspensão dos movimentos e o silêncio criam uma atmosfera de tensão antes da pergunta da menina sobre o significado de "desquitada".', 'dificil'),
    ('portugues', 'Interpretação de Texto', 2023, 'Qual recurso argumentativo é utilizado em textos de publicidade que associam um produto a um estilo de vida desejado?', 'Argumento de autoridade', 'Apelo emocional (pathos)', 'Silogismo lógico', 'Argumento ad hominem', 'Intertextualidade formal', 'B', 'A publicidade usa o apelo emocional (pathos) para associar produtos a sentimentos, aspirações e estilos de vida.', 'medio'),
    ('portugues', 'Gramática', 2022, 'A concordância verbal está correta em qual alternativa?', 'Faz dois anos que não o vejo', 'Haviam muitas pessoas no evento', 'Fazem dez anos de casados', 'Existem um problema grave', 'Houveram muitas reclamações', 'A', '"Faz" é verbo impessoal (indica tempo decorrido) e fica invariável na 3ª pessoa do singular.', 'medio'),

    -- ===================== HISTÓRIA =====================
    ('historia', 'Brasil Colonial', 2022, 'O Sistema de Capitanias Hereditárias foi instituído em qual período?', 'Período Pombalino', 'Período Colonial Tardio', 'Primeiro Reinado', 'Período de colonização inicial', 'Período Regencial', 'D', 'As Capitanias Hereditárias foram instituídas em 1532, na fase inicial da colonização portuguesa no Brasil.', 'medio'),
    ('historia', 'Brasil República', 2019, 'O texto "Era necessário construir um ritmo novo... erguer um novo Tempo" refere-se a qual período da história brasileira?', 'Proclamação da República', 'Era Vargas e o Estado Novo', 'Abertura Política', 'Ditadura Militar pós-1964', 'Governo JK', 'B', 'O trecho refere-se ao discurso varguista de renovação nacional, associado ao Estado Novo (1937-1945).', 'dificil'),
    ('historia', 'História Geral', 2020, 'A Revolução Soviética de 1917, a ascensão dos EUA e o início da contestação anticolonial marcaram a década seguinte à:', 'Segunda Guerra Mundial', 'Primeira Guerra Mundial', 'Guerra Fria', 'Revolução Francesa', 'Guerra dos Bôeres', 'B', 'Esses fenômenos caracterizaram a década de 1920, posterior ao fim da Primeira Guerra Mundial (1914-1918).', 'medio'),
    ('historia', 'História Geral', 2020, 'A crise de 1929 foi precedida por eventos como a Revolução Soviética e a ascensão dos EUA. Qual foi sua principal consequência geopolítica?', 'Fim das monarquias europeias', 'Preparação das condições para uma nova guerra mundial', 'Criação da ONU', 'Independência das colônias africanas', 'Formação do Mercosul', 'B', 'A crise de 1929 gerou instabilidade econômica e social que favoreceu o ascenso de regimes totalitários e levou à Segunda Guerra Mundial.', 'medio'),
    ('historia', 'Ditadura Militar', 2021, 'O regime militar brasileiro (1964-1985) foi marcado por:', 'Ampla liberdade de imprensa e pluripartidarismo', 'Supressão de direitos políticos, censura e perseguição a opositores', 'Eleições livres e diretas para presidente', 'Descentralização do poder político', 'Reforma agrária efetiva', 'B', 'A ditadura militar caracterizou-se pelo fechamento político, atos institucionais, censura à imprensa e repressão aos opositores.', 'facil'),
    ('historia', 'Escravidão no Brasil', 2022, 'A Lei Áurea, assinada em 1888, aboliu a escravidão no Brasil. Quem a assinou?', 'Dom Pedro I', 'Dom Pedro II', 'Princesa Isabel', 'Marechal Deodoro', 'Benjamin Constant', 'C', 'A Princesa Isabel, regente do Brasil na ausência de Dom Pedro II, assinou a Lei Áurea em 13 de maio de 1888.', 'facil'),
    ('historia', 'Relações Internacionais', 2019, 'O G4 (Brasil, Alemanha, Índia e Japão) defende a reforma do Conselho de Segurança da ONU com o objetivo de:', 'Reduzir o número de membros permanentes', 'Ampliar o número de membros permanentes para refletir o século XXI', 'Extinguir o direito de veto', 'Transferir a sede da ONU', 'Criar um conselho paralelo', 'B', 'O G4 defende a ampliação do Conselho de Segurança, argumentando que o formato atual com 5 membros permanentes não representa a realidade do século XXI.', 'medio'),
    ('historia', 'Primeira República', 2020, 'A política do "café com leite" na Primeira República (1889-1930) refere-se à alternância de poder entre:', 'Rio de Janeiro e Bahia', 'São Paulo e Minas Gerais', 'Rio Grande do Sul e São Paulo', 'Minas Gerais e Rio de Janeiro', 'Pernambuco e Bahia', 'B', 'A política dos governadores privilegiava a alternância da presidência entre as elites cafeeiras de São Paulo e as pecuaristas de Minas Gerais.', 'facil'),
    ('historia', 'Independência do Brasil', 2021, 'O "Grito do Ipiranga", em 7 de setembro de 1822, foi protagonizado por:', 'Dom João VI', 'José Bonifácio', 'Dom Pedro I', 'Tiradentes', 'Marquês de Pombal', 'C', 'Dom Pedro I proclamou a Independência do Brasil às margens do riacho Ipiranga, em São Paulo, em 7 de setembro de 1822.', 'facil'),
    ('historia', 'Abolicionismo', 2023, 'A Lei do Ventre Livre (1871) determinava que:', 'Todos os escravos maiores de 60 anos seriam libertos', 'Os filhos de escravos nascidos a partir daquela data seriam livres', 'A importação de escravos seria proibida', 'Os escravos poderiam comprar sua liberdade', 'A escravidão seria abolida em 10 anos', 'B', 'A Lei do Ventre Livre (1871) declarou livres os filhos de mulheres escravizadas nascidos após sua promulgação.', 'medio'),

    -- ===================== GEOGRAFIA =====================
    ('geografia', 'Meio Ambiente', 2019, 'O Ibama investigou o extermínio de abelhas por agrotóxicos (neonicotinoides) em São Paulo e Minas Gerais. Qual é a principal consequência desse problema para a agricultura?', 'Redução da área plantada', 'Ameaça à polinização e consequente queda na produtividade agrícola', 'Aumento do preço dos pesticidas', 'Diminuição da importação de alimentos', 'Redução da população humana', 'B', 'As abelhas são fundamentais para a polinização. Seu desaparecimento compromete a reprodução das plantas e ameaça a produtividade de diversas culturas agrícolas.', 'medio'),
    ('geografia', 'Geopolítica', 2019, 'A fome não é um problema técnico, pois não se deve à falta de alimentos. De acordo com o texto, qual é sua real dimensão?', 'Climática', 'Política e distributiva', 'Tecnológica', 'Biológica', 'Geográfica', 'B', 'O texto aponta que a fome é um problema político, pois existem condições materiais para resolvê-la, mas há falhas na distribuição e acesso aos alimentos.', 'medio'),
    ('geografia', 'Urbanização', 2020, 'O processo que concentra população de renda elevada em áreas centrais e desloca a população menos favorecida para a periferia é denominado:', 'Êxodo rural', 'Segregação socioespacial urbana', 'Metropolização', 'Conurbação', 'Gentrificação', 'B', 'A segregação socioespacial é o processo pelo qual diferentes grupos sociais ocupam espaços urbanos distintos conforme sua renda e poder político.', 'medio'),
    ('geografia', 'Agricultura', 2020, 'A soja é a cultura agrícola brasileira que mais cresceu nas últimas décadas. Uma causa para esse crescimento é:', 'A redução dos impostos sobre exportação', 'Os avanços tecnológicos, o manejo e a eficiência dos produtores', 'A redução do consumo interno de proteínas', 'A diminuição da pecuária bovina', 'O aumento das chuvas no Cerrado', 'B', 'O aumento da produtividade da soja está associado aos avanços tecnológicos no manejo agrícola e à eficiência dos produtores brasileiros.', 'facil'),
    ('geografia', 'Clima', 2020, 'O fenômeno El Niño tem como causa o aumento da:', 'Temperatura do Oceano Atlântico Sul', 'Temperatura da superfície do Oceano Pacífico Equatorial', 'Pressão atmosférica sobre o continente americano', 'Extensão da camada de ozônio', 'Salinidade do Mar do Caribe', 'B', 'O El Niño é causado pelo aquecimento anormal das águas superficiais do Oceano Pacífico Equatorial, alterando padrões climáticos globais.', 'medio'),
    ('geografia', 'Urbanização', 2020, 'Brasília foi a primeira cidade moderna inscrita na lista do Patrimônio Mundial da UNESCO. Seu plano urbano foi idealizado por:', 'Oscar Niemeyer', 'Lúcio Costa', 'Burle Marx', 'João Filgueiras Lima', 'Affonso Eduardo Reidy', 'B', 'O Plano Piloto de Brasília foi elaborado por Lúcio Costa com base nos princípios da Carta de Atenas (1933), e os edifícios foram projetados por Oscar Niemeyer.', 'facil'),
    ('geografia', 'Geopolítica', 2020, 'A Crimeia foi anexada pela Rússia em 2014 após um acordo assinado por Vladimir Putin. O principal argumento russo foi:', 'Questões comerciais com a Ucrânia', 'Defesa de população de etnia e língua russas na região', 'Necessidade de acesso ao Mar Negro', 'Disputa por reservas de petróleo', 'Pressão de países da OTAN', 'B', 'A Rússia justificou a anexação da Crimeia com a proteção da população de língua e etnia russas presentes na região, além de interesses estratégicos militares.', 'dificil'),
    ('geografia', 'Globalização', 2019, 'A reestruturação global da indústria promoveu um forte deslocamento do processo produtivo para países em desenvolvimento. A condição para a inclusão dos trabalhadores nesse novo processo é:', 'Alto nível de sindicalização', 'Qualificação e adaptação às novas tecnologias produtivas', 'Trabalho em tempo integral', 'Moradia próxima às fábricas', 'Conhecimento em idiomas estrangeiros', 'B', 'A reestruturação produtiva exige trabalhadores qualificados e adaptados às novas tecnologias, como automação e informática.', 'medio'),
    ('geografia', 'Geopolítica', 2023, 'A região de Xinjiang, na China, recebeu mais de 1,7 milhão de migrantes entre 2000 e 2010 incentivados pelo governo. O principal objetivo dessa política foi:', 'Aumentar a produção industrial da região', 'Aumentar a proporção da etnia Han em relação às minorias locais', 'Reduzir o desemprego no leste da China', 'Desenvolver a infraestrutura turística', 'Explorar reservas de petróleo', 'B', 'O governo chinês incentivou a migração da etnia Han para Xinjiang como estratégia de controle político e cultural sobre a população Uigur.', 'dificil'),
    ('geografia', 'Desenvolvimento Sustentável', 2023, 'O sistema agroflorestal "cabruca", no sul da Bahia, consiste no cultivo do cacau à sombra do dossel da floresta nativa. Sua principal vantagem ambiental é:', 'Maior produtividade por hectare', 'Superior conservação da biodiversidade em comparação com monoculturas', 'Redução do uso de agrotóxicos sintéticos', 'Maior resistência à seca', 'Facilidade de mecanização', 'B', 'O sistema cabruca é considerado amigável à vida silvestre por preservar o dossel da floresta nativa, conservando maior biodiversidade do que monoculturas tropicais.', 'medio'),

    -- ===================== FÍSICA =====================
    ('fisica', 'Cinemática', 2023, 'Um carro parte do repouso e acelera uniformemente a 2 m/s². Qual sua velocidade após 5 segundos?', '5 m/s', '7 m/s', '10 m/s', '12 m/s', '15 m/s', 'C', 'Usando v = v0 + at: v = 0 + 2×5 = 10 m/s', 'facil'),
    ('fisica', 'Dinâmica', 2022, 'Um bloco de 5 kg é submetido a uma força de 20 N. Qual é sua aceleração? (Desconsidere o atrito)', '0,25 m/s²', '2 m/s²', '4 m/s²', '100 m/s²', '25 m/s²', 'C', 'Pela Segunda Lei de Newton: F = ma → a = F/m = 20/5 = 4 m/s²', 'facil'),
    ('fisica', 'Eletricidade', 2021, 'Um resistor de 10 Ω é submetido a uma diferença de potencial de 220 V. Qual a corrente elétrica que o percorre?', '2 A', '10 A', '22 A', '220 A', '2200 A', 'C', 'Pela Lei de Ohm: I = V/R = 220/10 = 22 A', 'facil'),
    ('fisica', 'Termologia', 2020, 'Uma substância passa de sólido para líquido sem variação de temperatura. Esse processo é chamado de:', 'Vaporização', 'Sublimação', 'Fusão', 'Solidificação', 'Condensação', 'C', 'Fusão é a mudança de estado de sólido para líquido, que ocorre a temperatura constante (ponto de fusão).', 'facil'),
    ('fisica', 'Óptica', 2022, 'Qual fenômeno explica a formação do arco-íris?', 'Reflexão total interna', 'Difração da luz', 'Dispersão da luz ao passar por gotículas de água', 'Interferência construtiva', 'Polarização da luz', 'C', 'O arco-íris se forma quando a luz solar é decomposta (dispersão) ao passar por gotículas de água na atmosfera, separando as diferentes frequências visíveis.', 'medio'),
    ('fisica', 'Ondulatória', 2021, 'O som é uma onda mecânica. Isso significa que:', 'Se propaga no vácuo', 'Necessita de um meio material para se propagar', 'Viaja sempre na velocidade da luz', 'É uma onda transversal', 'Não pode ser refletido', 'B', 'Ondas mecânicas, como o som, necessitam de um meio material (sólido, líquido ou gasoso) para se propagar, diferentemente das ondas eletromagnéticas.', 'facil'),
    ('fisica', 'Cinemática', 2020, 'Um objeto é lançado verticalmente para cima com velocidade inicial de 20 m/s. Considerando g = 10 m/s², qual a altura máxima atingida?', '10 m', '20 m', '40 m', '200 m', '2 m', 'B', 'Na altura máxima, v = 0. Usando v² = v0² - 2gh: 0 = 400 - 20h → h = 20 m', 'medio'),
    ('fisica', 'Eletromagnetismo', 2023, 'Qual é a unidade de medida da força elétrica no Sistema Internacional?', 'Watt', 'Joule', 'Newton', 'Coulomb', 'Volt', 'C', 'A força elétrica, como qualquer força, é medida em Newton (N) no Sistema Internacional de Unidades.', 'facil'),
    ('fisica', 'Termodinâmica', 2022, 'O Primeiro Princípio da Termodinâmica afirma que:', 'A energia de um sistema isolado sempre aumenta', 'A energia total de um sistema isolado é conservada', 'O calor sempre flui do frio para o quente', 'A entropia de um sistema diminui espontaneamente', 'Não é possível atingir o zero absoluto', 'B', 'O Primeiro Princípio da Termodinâmica é o princípio da conservação da energia: a energia não é criada nem destruída, apenas transformada.', 'medio'),
    ('fisica', 'Gravitação', 2021, 'Dois corpos de massas m1 e m2, separados por uma distância d, se atraem com uma força gravitacional. Se a distância for dobrada, a força gravitacional:', 'Dobra', 'Reduz à metade', 'Quadruplica', 'Reduz a um quarto', 'Permanece a mesma', 'D', 'Pela Lei da Gravitação Universal, F ∝ 1/d². Se d dobra, F reduz para 1/4 do valor original.', 'medio'),

    -- ===================== BIOLOGIA =====================
    ('biologia', 'Ecologia', 2022, 'Qual alternativa representa corretamente uma cadeia alimentar?', 'Leão → Zebra → Capim', 'Capim → Zebra → Leão', 'Zebra → Capim → Leão', 'Leão → Capim → Zebra', 'Capim → Leão → Zebra', 'B', 'Em uma cadeia alimentar, os produtores (plantas) vêm primeiro, seguidos pelos consumidores primários e depois pelos secundários.', 'facil'),
    ('biologia', 'Genética', 2023, 'O daltonismo é uma característica hereditária ligada ao cromossomo X. Um homem daltônico (X^d Y) e uma mulher normal portadora (X^D X^d) têm filhos. Qual a probabilidade de um filho homem ser daltônico?', '25%', '50%', '75%', '100%', '0%', 'B', 'Os filhos homens recebem o Y do pai e um X da mãe. Como a mãe é portadora (X^D X^d), há 50% de chance de passar X^d para o filho homem, tornando-o daltônico.', 'dificil'),
    ('biologia', 'Citologia', 2022, 'A mitocôndria é a organela responsável pela:', 'Síntese de proteínas', 'Produção de energia (ATP) por respiração celular', 'Digestão intracelular', 'Síntese de lipídios', 'Controle das atividades celulares', 'B', 'A mitocôndria é conhecida como a "usina de energia" da célula, pois realiza a respiração celular aeróbica, produzindo ATP.', 'facil'),
    ('biologia', 'Ecologia', 2021, 'O que é uma relação de mutualismo?', 'Uma espécie se beneficia sem prejudicar a outra', 'Ambas as espécies se beneficiam da relação', 'Uma espécie se beneficia e a outra é prejudicada', 'Ambas as espécies são prejudicadas', 'Nenhuma das espécies é afetada', 'B', 'O mutualismo é uma relação ecológica harmônica interespecífica em que ambas as espécies envolvidas se beneficiam.', 'facil'),
    ('biologia', 'Evolução', 2020, 'A seleção natural, proposta por Charles Darwin, afirma que:', 'Todos os indivíduos de uma espécie têm as mesmas chances de sobrevivência', 'Indivíduos com características mais adaptadas ao ambiente tendem a sobreviver e se reproduzir mais', 'As espécies foram criadas de forma imutável', 'A evolução ocorre por vontade própria dos organismos', 'O ambiente não influencia na sobrevivência das espécies', 'B', 'Darwin propôs que organismos com variações hereditárias vantajosas ao ambiente têm maior chance de sobreviver e transmitir essas características à prole.', 'facil'),
    ('biologia', 'Bioquímica', 2022, 'As enzimas são catalisadores biológicos que:', 'Consomem-se durante as reações químicas', 'Aumentam a energia de ativação das reações', 'Reduzem a energia de ativação, acelerando as reações sem serem consumidas', 'São sempre de natureza lipídica', 'Funcionam apenas em altas temperaturas', 'C', 'As enzimas são proteínas que catalisam reações biológicas reduzindo a energia de ativação necessária, sem serem consumidas no processo.', 'medio'),
    ('biologia', 'Saúde e Doenças', 2019, 'A dengue é transmitida pelo mosquito Aedes aegypti. O controle do vetor é a principal medida preventiva porque:', 'O vírus não possui vacina eficaz para todas as cepas', 'O mosquito é o único reservatório do vírus', 'Eliminar criadouros interrompe o ciclo de transmissão da doença', 'Os medicamentos antivirais são inacessíveis', 'A doença só afeta crianças', 'C', 'O Aedes aegypti é o vetor da dengue. Eliminar seus criadouros (água parada) interrompe o ciclo de transmissão, pois o mosquito não consegue se reproduzir.', 'medio'),
    ('biologia', 'Fisiologia', 2021, 'O sistema nervoso autônomo simpático é ativado em situações de estresse, promovendo:', 'Diminuição dos batimentos cardíacos e dilatação das pupilas', 'Aumento dos batimentos cardíacos, dilatação das pupilas e inibição da digestão', 'Aumento da digestão e diminuição da frequência respiratória', 'Relaxamento muscular e redução da pressão arterial', 'Aumento da salivação e diminuição dos batimentos cardíacos', 'B', 'O sistema simpático prepara o organismo para situações de "luta ou fuga", aumentando FC, dilatando pupilas e inibindo funções digestivas.', 'dificil'),
    ('biologia', 'Ecologia', 2023, 'O desmatamento da Floresta Amazônica contribui para as mudanças climáticas globais principalmente por:', 'Aumentar a reflexão da luz solar', 'Liberar CO2 armazenado na biomassa vegetal para a atmosfera', 'Reduzir a umidade do solo', 'Aumentar a biodiversidade de espécies', 'Diminuir a temperatura local', 'B', 'As árvores armazenam carbono em sua biomassa. Quando desmatadas e queimadas, esse carbono é liberado como CO2, intensificando o efeito estufa.', 'medio'),
    ('biologia', 'Genética', 2021, 'Nos seres humanos, o número diploide de cromossomos é:', '23', '46', '48', '92', '22', 'B', 'Os seres humanos possuem 46 cromossomos (2n = 46), organizados em 23 pares de cromossomos homólogos.', 'facil'),

    -- ===================== QUÍMICA =====================
    ('quimica', 'Reações Químicas', 2022, 'Na reação de combustão completa do metano (CH4 + 2O2 → CO2 + 2H2O), os produtos formados são:', 'Monóxido de carbono e água', 'Dióxido de carbono e água', 'Metanol e oxigênio', 'Carbono e hidrogênio', 'Etano e dióxido de carbono', 'B', 'Na combustão completa de hidrocarbonetos, os produtos são sempre dióxido de carbono (CO2) e água (H2O).', 'facil'),
    ('quimica', 'Tabela Periódica', 2021, 'Os elementos da família dos gases nobres (grupo 18) têm como característica principal:', 'Alta reatividade química', 'Camada de valência incompleta', 'Camada de valência completa e baixíssima reatividade', 'Serem todos sólidos à temperatura ambiente', 'Formarem ligações iônicas facilmente', 'C', 'Os gases nobres possuem oito elétrons na camada de valência (exceto He com 2), conferindo-lhes extrema estabilidade e baixíssima reatividade.', 'facil'),
    ('quimica', 'Eletroquímica', 2023, 'Na eletrólise da água (2H2O → 2H2 + O2), o gás hidrogênio é produzido no:', 'Ânodo (polo positivo)', 'Cátodo (polo negativo)', 'Nos dois eletrodos igualmente', 'No eletrólito', 'Na fonte de tensão', 'B', 'Na eletrólise da água, o hidrogênio (H2) é produzido no cátodo por redução, e o oxigênio (O2) no ânodo por oxidação.', 'medio'),
    ('quimica', 'Funções Orgânicas', 2020, 'O etanol (C2H5OH) é classificado como:', 'Ácido carboxílico', 'Aldeído', 'Éster', 'Álcool', 'Cetona', 'D', 'O etanol possui o grupo funcional -OH ligado a carbono saturado, caracterizando-o como um álcool.', 'facil'),
    ('quimica', 'Soluções', 2022, 'Se 10 g de NaCl são dissolvidos em 100 mL de água, qual a concentração em g/L?', '1 g/L', '10 g/L', '100 g/L', '0,1 g/L', '1000 g/L', 'C', 'C = m/V = 10 g / 0,1 L = 100 g/L', 'medio'),
    ('quimica', 'Cinética Química', 2021, 'Aumentar a temperatura de uma reação química geralmente:', 'Diminui a velocidade da reação', 'Não altera a velocidade da reação', 'Aumenta a velocidade da reação', 'Impede a reação de ocorrer', 'Reduz a produção de energia', 'C', 'O aumento de temperatura fornece mais energia cinética às partículas, aumentando a frequência e a eficácia das colisões, acelerando a reação.', 'facil'),
    ('quimica', 'Química Ambiental', 2023, 'O efeito estufa é causado principalmente pelo acúmulo de gases como CO2 e CH4 na atmosfera. Esse acúmulo provoca:', 'Resfriamento global', 'Aquecimento global por retenção de calor', 'Destruição da camada de ozônio', 'Chuva ácida', 'Inversão térmica local', 'B', 'Os gases do efeito estufa absorvem e reemitem radiação infravermelha (calor), impedindo que o calor escape para o espaço e elevando a temperatura média da Terra.', 'facil'),
    ('quimica', 'Equilíbrio Químico', 2022, 'O Princípio de Le Chatelier afirma que quando um sistema em equilíbrio é perturbado, ele:', 'Permanece inalterado', 'Reage para amplificar a perturbação', 'Reage para minimizar o efeito da perturbação', 'Muda de estado físico', 'Aumenta sua temperatura', 'C', 'O Princípio de Le Chatelier estabelece que um sistema em equilíbrio submetido a uma perturbação reage de forma a diminuir o efeito dessa perturbação.', 'medio'),
    ('quimica', 'Radioatividade', 2021, 'A radioatividade é um fenômeno que ocorre em núcleos atômicos instáveis. O tipo de radiação mais penetrante é:', 'Radiação alfa (α)', 'Radiação beta (β)', 'Radiação gama (γ)', 'Radiação UV', 'Radiação infravermelha', 'C', 'A radiação gama é a mais penetrante, sendo necessário chumbo ou concreto espesso para bloqueá-la. A alfa é a menos penetrante.', 'medio'),
    ('quimica', 'Funções Orgânicas', 2023, 'O ácido acético (CH3COOH), presente no vinagre, pertence à função:', 'Álcool', 'Aldeído', 'Cetona', 'Ácido carboxílico', 'Éster', 'D', 'O ácido acético possui o grupo carboxila (-COOH), que caracteriza os ácidos carboxílicos.', 'facil'),

    -- ===================== FILOSOFIA =====================
    ('filosofia', 'Filosofia Antiga', 2022, 'Sócrates ficou conhecido pelo método filosófico da maiêutica, que consiste em:', 'Impor verdades absolutas aos alunos', 'Fazer perguntas para conduzir o interlocutor ao autoconhecimento e à descoberta da verdade', 'Estudar a natureza dos astros', 'Criar leis para governar a cidade', 'Negar a existência do conhecimento', 'B', 'A maiêutica socrática é um método dialógico em que perguntas sucessivas levam o interlocutor a descobrir verdades por si mesmo, em analogia ao parto.', 'medio'),
    ('filosofia', 'Ética', 2021, 'Para Kant, uma ação é moralmente correta quando:', 'Produz o maior bem para o maior número de pessoas', 'Segue o imperativo categórico: age apenas segundo aquela máxima que possas querer seja lei universal', 'É aprovada pela maioria da sociedade', 'Gera prazer para quem a pratica', 'Está de acordo com as leis do Estado', 'B', 'O imperativo categórico kantiano é a pedra central de sua ética deontológica: uma ação é moral se pode ser universalizada sem contradição.', 'dificil'),
    ('filosofia', 'Filosofia Política', 2023, 'O filósofo John Locke defendia que o Estado deve garantir os direitos naturais dos cidadãos, entre eles:', 'Propriedade privada, vida e liberdade', 'Igualdade absoluta e abolição da propriedade', 'Submissão total ao soberano', 'Democracia direta e participação universal', 'Controle estatal da economia', 'A', 'Locke sustentava que os direitos naturais são vida, liberdade e propriedade, e que o Estado legítimo existe para protegê-los.', 'medio'),
    ('filosofia', 'Epistemologia', 2020, 'O racionalismo, corrente filosófica representada por Descartes, defende que:', 'Todo conhecimento vem exclusivamente da experiência sensorial', 'A razão é a principal fonte de conhecimento verdadeiro', 'Não é possível conhecer nada com certeza', 'O conhecimento é construído socialmente', 'Os sentidos nunca enganam', 'B', 'Descartes inaugura o racionalismo moderno ao afirmar que a razão, e não os sentidos, é o fundamento do conhecimento verdadeiro.', 'medio'),

    -- ===================== SOCIOLOGIA =====================
    ('sociologia', 'Desigualdade Social', 2022, 'O conceito de mobilidade social refere-se à:', 'Migração de pessoas entre países', 'Mudança de posição de um indivíduo ou grupo na estrutura social', 'Movimentos grevistas de trabalhadores', 'Deslocamento de populações em zonas de conflito', 'Migração campo-cidade', 'B', 'Mobilidade social é o processo pelo qual indivíduos ou grupos mudam de posição (ascendem ou descendem) na hierarquia social.', 'facil'),
    ('sociologia', 'Cultura', 2021, 'O etnocentrismo é a tendência de:', 'Valorizar igualmente todas as culturas', 'Julgar outras culturas a partir dos valores e padrões da própria cultura', 'Adotar costumes de outras culturas', 'Estudar objetivamente as diferenças culturais', 'Defender a miscigenação cultural', 'B', 'O etnocentrismo consiste em avaliar culturas alheias como inferiores, tomando a própria cultura como referência e parâmetro absoluto.', 'facil'),
    ('sociologia', 'Trabalho e Capitalismo', 2023, 'O conceito de alienação do trabalho, desenvolvido por Karl Marx, refere-se à situação em que o trabalhador:', 'É bem remunerado e satisfeito com seu trabalho', 'Sente-se estranho ao produto de seu trabalho, pois não o controla nem se identifica com ele', 'Tem autonomia total sobre o processo produtivo', 'Participa dos lucros da empresa', 'Trabalha apenas por prazer', 'B', 'Marx descreve a alienação como o processo pelo qual o trabalho deixa de ser uma expressão humana criativa e passa a ser algo externo e hostil ao próprio trabalhador.', 'medio'),
    ('sociologia', 'Cidadania', 2020, 'Segundo T. H. Marshall, a cidadania plena é composta por direitos:', 'Apenas políticos e econômicos', 'Civis, políticos e sociais', 'Exclusivamente trabalhistas', 'Naturais e divinos', 'Nacionais e internacionais', 'B', 'Marshall identificou três dimensões da cidadania: direitos civis (liberdades individuais), políticos (participação no poder) e sociais (bem-estar e educação).', 'medio');
  `);
}
