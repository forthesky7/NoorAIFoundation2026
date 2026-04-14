import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("noor_token") || null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem("noor_token", token);
    } else {
      localStorage.removeItem("noor_token");
    }
    set({ token });
  },
}));
