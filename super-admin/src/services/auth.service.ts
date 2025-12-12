import api from './api';

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: User;
  };
}

export const AuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/super-admin/login', {
      email,
      password,
    });

    if (response.data.success) {
      localStorage.setItem('super_admin_token', response.data.data.token);
      localStorage.setItem(
        'super_admin_user',
        JSON.stringify(response.data.data.admin),
      );
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('super_admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('super_admin_user');
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('super_admin_token');
  },
};
