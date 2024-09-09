import { create } from "zustand";
import { persist } from "zustand/middleware";

type Transaction = {
  location: string;
  dateTime: string;
  requestedAmount: string;
  approvedAmount: string;
};

type MealPlan = {
  startDate: string;
  planName: string;
  currentBalance: string;
  transactions: Transaction[];
};

type MealOption = "Green" | "Blue" | "Red";

interface AppState {
  darkMode: boolean;
  mealPlans: MealPlan[];
  currentMealOption: MealOption | null;
  toggleDarkMode: () => void;
  addMealPlanData: (newData: MealPlan[]) => void;
  clearAllData: () => void;
  getCurrentMealOption: () => MealOption | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      mealPlans: [],
      currentMealOption: null,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      addMealPlanData: (newData) =>
        set((state) => {
          const updatedMealPlans = [...state.mealPlans];
          let detectedMealOption: MealOption | null = null;

          newData.forEach((newPlan) => {
            const existingPlanIndex = updatedMealPlans.findIndex(
              (plan) =>
                plan.startDate === newPlan.startDate &&
                plan.planName === newPlan.planName,
            );

            if (existingPlanIndex !== -1) {
              // Update existing plan
              const existingPlan = updatedMealPlans[existingPlanIndex];
              updatedMealPlans[existingPlanIndex] = {
                ...existingPlan,
                currentBalance: newPlan.currentBalance,
                transactions: [
                  ...existingPlan.transactions,
                  ...newPlan.transactions,
                ].filter(
                  (transaction, index, self) =>
                    index ===
                    self.findIndex(
                      (t) =>
                        t.dateTime === transaction.dateTime &&
                        t.location === transaction.location &&
                        t.approvedAmount === transaction.approvedAmount,
                    ),
                ),
              };
            } else {
              // Add new plan
              updatedMealPlans.push(newPlan);
            }

            // Detect meal option
            if (newPlan.planName.includes("Green"))
              detectedMealOption = "Green";
            else if (newPlan.planName.includes("Blue"))
              detectedMealOption = "Blue";
            else if (newPlan.planName.includes("Red"))
              detectedMealOption = "Red";
          });

          return {
            mealPlans: updatedMealPlans,
            currentMealOption: detectedMealOption || state.currentMealOption,
          };
        }),
      clearAllData: () => set({ mealPlans: [], currentMealOption: null }),
      getCurrentMealOption: () => get().currentMealOption,
    }),
    {
      name: "cmu-meal-tracker-storage",
    },
  ),
);
