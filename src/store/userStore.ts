// src/store/userStore.ts

import { create } from "zustand";

type User = {
  uid: string;
  username: string;
  attendanceCriteria: number;
};

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));