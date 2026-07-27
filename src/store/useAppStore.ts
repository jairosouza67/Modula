import { create } from 'zustand';

interface AppState {
  isCheckinOpen: boolean;
  setCheckinOpen: (open: boolean) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isCheckinOpen: false,
  setCheckinOpen: (open) => set({ isCheckinOpen: open }),
  selectedGroupId: null,
  setSelectedGroupId: (id) => set({ selectedGroupId: id }),
}));
