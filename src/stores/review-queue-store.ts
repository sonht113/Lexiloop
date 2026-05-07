import { create } from 'zustand';

type ReviewQueueState = {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  reset: () => void;
};

export const useReviewQueueStore = create<ReviewQueueState>((set) => ({
  currentIndex: 0,
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  reset: () => set({ currentIndex: 0 }),
}));
