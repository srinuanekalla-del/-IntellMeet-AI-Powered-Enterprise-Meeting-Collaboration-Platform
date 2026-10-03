export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Member';
  };
  accessToken: string;
}

export interface ApiErrorShape {
  message: string;
}
