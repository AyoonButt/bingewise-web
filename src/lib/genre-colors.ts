export const genreColors: Record<string, string> = {
  Action: "#FF5722",
  "Action & Adventure": "#FF5722",
  Adventure: "#FF5722",
  Comedy: "#FF9800",
  Drama: "#3F51B5",
  Horror: "#9C27B0",
  Romance: "#E91E63",
  "Science Fiction": "#00BCD4",
  SciFi: "#00BCD4",
  "Sci-Fi": "#00BCD4",
  "Sci-Fi & Fantasy": "#00BCD4",
  Thriller: "#607D8B",
  Documentary: "#4CAF50",
  Animation: "#CDDC39",
  Family: "#8BC34A",
  Fantasy: "#7C4DFF",
  Mystery: "#607D8B",
  "TV Movie": "#FF5722",
  Western: "#795548",
  Music: "#E91E63",
  History: "#795548",
  War: "#607D8B",
  News: "#2196F3",
  Reality: "#FF9800",
  Talk: "#9C27B0",
  Soap: "#E91E63",
  Kids: "#8BC34A",
};

export function getGenreColor(name: string): string {
  return genreColors[name] || "#9E9E9E";
}
