// constants/theme.ts
export const Colors = {
  // Primary Blues
  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue300: "#93C5FD",
  blue400: "#60A5FA",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E40AF",
  blue900: "#1E3A8A",

  // Brand
  primary: "#1E6FD9",
  primaryDark: "#1554B0",
  primaryLight: "#4A9EF5",
  accent: "#00D4FF",
  accentDim: "#00AACC",

  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",

  light: {
    bg: "#F8FAFF",
    bgSecondary: "#EFF3FF",
    bgCard: "#FFFFFF",
    bgInput: "#F1F5FE",
    text: "#0A1628",
    textSecondary: "#4A5A7A",
    textMuted: "#8A9ABB",
    border: "#DDE5F8",
    divider: "#EEF2FF",
    shadow: "rgba(30, 111, 217, 0.12)",
  },

  dark: {
    bg: "#060D1A",
    bgSecondary: "#0A1628",
    bgCard: "#0F1E38",
    bgInput: "#162240",
    text: "#E8F0FF",
    textSecondary: "#8AAAD4",
    textMuted: "#4A6080",
    border: "#1A2E50",
    divider: "#112038",
    shadow: "rgba(0, 0, 0, 0.4)",
  },
};

export const Typography = {
  // Font families (use system fonts as fallback, Expo Google Fonts recommended)
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
    mono: "Courier",
  },

  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    "2xl": 26,
    "3xl": 32,
    "4xl": 40,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ENEM Subjects
export const SUBJECTS = [
  { id: "matematica", label: "Matemática", color: "#3B82F6", icon: "📐" },
  { id: "portugues", label: "Português", color: "#8B5CF6", icon: "📝" },
  { id: "historia", label: "História", color: "#F59E0B", icon: "🏛️" },
  { id: "geografia", label: "Geografia", color: "#22C55E", icon: "🌍" },
  {
    id: "ciencias",
    label: "Ciências da Natureza",
    color: "#06B6D4",
    icon: "🔬",
  },
  { id: "fisica", label: "Física", color: "#EF4444", icon: "⚛️" },
  { id: "quimica", label: "Química", color: "#EC4899", icon: "🧪" },
  { id: "biologia", label: "Biologia", color: "#10B981", icon: "🧬" },
  { id: "filosofia", label: "Filosofia", color: "#6366F1", icon: "🤔" },
  { id: "sociologia", label: "Sociologia", color: "#F97316", icon: "👥" },
  { id: "literatura", label: "Literatura", color: "#14B8A6", icon: "📚" },
  { id: "ingles", label: "Inglês", color: "#64748B", icon: "🇺🇸" },
  { id: "espanhol", label: "Espanhol", color: "#DC2626", icon: "🇪🇸" },
  { id: "redacao", label: "Redação", color: "#7C3AED", icon: "✍️" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];
