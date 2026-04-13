import { create } from 'zustand';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminStore {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAdmin: (admin: Admin) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  admin: null,
  token: localStorage.getItem('admin_token'),
  isAuthenticated: !!localStorage.getItem('admin_token'),

  setAdmin: (admin) => set({ admin }),

  setToken: (token) => {
    localStorage.setItem('admin_token', token);
    set({ token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ admin: null, token: null, isAuthenticated: false });
  },
}));
