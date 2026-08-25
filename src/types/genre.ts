export interface GenreDto {
  id: number;
  name: string;
}

export interface UserGenreDto {
  userId: number;
  genreId: number;
  genreName: string;
  priority: number;
}

export interface AvailableGenre {
  genreId: number;
  genreName: string;
}

// Popular movie genres matching the Android app's hardcoded list.
// IDs match official TMDB API genre IDs.
export const AVAILABLE_GENRES: AvailableGenre[] = [
  { genreId: 28, genreName: "Action" },
  { genreId: 12, genreName: "Adventure" },
  { genreId: 16, genreName: "Animation" },
  { genreId: 35, genreName: "Comedy" },
  { genreId: 80, genreName: "Crime" },
  { genreId: 99, genreName: "Documentary" },
  { genreId: 18, genreName: "Drama" },
  { genreId: 10751, genreName: "Family" },
  { genreId: 14, genreName: "Fantasy" },
  { genreId: 36, genreName: "History" },
  { genreId: 27, genreName: "Horror" },
  { genreId: 10402, genreName: "Music" },
  { genreId: 9648, genreName: "Mystery" },
  { genreId: 10749, genreName: "Romance" },
  { genreId: 878, genreName: "Science Fiction" },
  { genreId: 10770, genreName: "TV Movie" },
  { genreId: 53, genreName: "Thriller" },
  { genreId: 10752, genreName: "War" },
  { genreId: 37, genreName: "Western" },
];
