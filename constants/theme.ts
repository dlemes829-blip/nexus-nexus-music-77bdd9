export interface ThemeAccent {
  id: string;
  name: string;
  primary: string;
  accent: string;
}

export const THEME_ACCENTS: ThemeAccent[] = [
  { id: "green",   name: "Spotify",   primary: "#1DB954", accent: "#1DB954" },
  { id: "purple",  name: "Roxo",      primary: "#9333EA", accent: "#7C3AED" },
  { id: "blue",    name: "Azul",      primary: "#3B82F6", accent: "#2563EB" },
  { id: "red",     name: "Vermelho",  primary: "#EF4444", accent: "#DC2626" },
  { id: "orange",  name: "Laranja",   primary: "#F97316", accent: "#EA580C" },
  { id: "pink",    name: "Rosa",      primary: "#EC4899", accent: "#DB2777" },
  { id: "teal",    name: "Teal",      primary: "#14B8A6", accent: "#0D9488" },
  { id: "yellow",  name: "Âmbar",     primary: "#F59E0B", accent: "#D97706" },
];
