import { create } from "zustand"
import { Analysis } from "@/types"

interface AppState {
  currentAnalysis: Analysis | null
  setCurrentAnalysis: (analysis: Analysis | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
}))
