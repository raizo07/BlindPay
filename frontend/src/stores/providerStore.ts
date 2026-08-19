import { create } from "zustand";

interface ProviderState {
    currentProviderIndex: number;
    setCurrentProviderIndex: (index: number) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
    currentProviderIndex: 2,
    setCurrentProviderIndex: (currentProviderIndex) => set({ currentProviderIndex }),
}));
