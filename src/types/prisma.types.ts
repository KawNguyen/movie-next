// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: string;
  providerId?: string;
  password?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  user: User;
}

export interface WatchHistory {
  id: string;
  userId: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  episodeId?: string;
  episodeName?: string;
  watchedAt: Date;
  progress: number;
  duration: number;
  user: User;
}

export interface Favorite {
  id: string;
  userId: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  movieType?: string;
  createdAt: Date;
  user: User;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
