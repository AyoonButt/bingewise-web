export interface AuthUserInfo {
  id: number;
  username: string;
  email: string;
  name: string | null;
  language: string;
  region: string;
  roles: string[];
  needsSetup: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number | null;
  user: AuthUserInfo | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SessionData {
  user: {
    userId: number;
    name: string;
    username: string;
    email: string;
    isPrivate: boolean;
    createdAt: string;
  };
  tokenExpiresAt: number;
  loginTimestamp: number;
}
