import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChangeSetDraftState {
  isActive: boolean;
  changeSetId: string | null;
  changeSetTitle: string | null;
  activate: (changeSetId: string, title: string) => void;
  deactivate: () => void;
}

export const useChangeSetStore = create<ChangeSetDraftState>()(
  persist(
    (set) => ({
      isActive: false,
      changeSetId: null,
      changeSetTitle: null,
      activate: (changeSetId, title) => set({ isActive: true, changeSetId, changeSetTitle: title }),
      deactivate: () => set({ isActive: false, changeSetId: null, changeSetTitle: null }),
    }),
    { name: 'changeset-draft-store' },
  ),
);
