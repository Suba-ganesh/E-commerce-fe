import { api } from './api';

export interface LoginResponse {
  status: string;
  data: {
    message: string;
    accessToken: string;
    user: any;
  };
}

export interface SignupResponse {
  status: string;
  data: {
    message: string;
    user: any;
  };
}

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    return await api.post<LoginResponse>('/auth/login', credentials);
  },
  
  signup: async (userData: any): Promise<SignupResponse> => {
    return await api.post<SignupResponse>('/auth/signup', userData);
  },

  forgotPassword: async (email: string): Promise<any> => {
    return await api.post<any>('/auth/forgot-password', { email });
  },

  resetPassword: async (data: any): Promise<any> => {
    return await api.post<any>('/auth/reset-password', data);
  },

  loginWithGoogle: async (token: string): Promise<LoginResponse> => {
    return await api.post<LoginResponse>('/auth/login/google', { token });
  },

  loginWithFacebook: async (token: string): Promise<LoginResponse> => {
    return await api.post<LoginResponse>('/auth/login/facebook', { token });
  },

  loginWithApple: async (token: string, extra_data?: any): Promise<LoginResponse> => {
    return await api.post<LoginResponse>('/auth/login/apple', { token, extra_data });
  },
};
