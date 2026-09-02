// stores/use-leave-modal.ts
import { create } from "zustand";

type LeaveModalStore = {
  isOpen: boolean;
  nextPath: string | null;
  openModal: (path: string) => void;
  closeModal: () => void;
};

export const useLeaveModal = create<LeaveModalStore>((set) => ({
  isOpen: false,
  nextPath: null,
  openModal: (path) => set({ isOpen: true, nextPath: path }),
  closeModal: () => set({ isOpen: false, nextPath: null }),
}));
