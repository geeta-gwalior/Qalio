import { create } from "zustand";
import { persist } from "zustand/middleware";

type ButtonState = {
  disabledButtons: Record<string, boolean>;
  setButtonDisabled: (assessmentId: string, disabled: boolean) => void;
  isButtonDisabled: (assessmentId: string) => boolean;
};

export const useAssessmentButtonStore = create<ButtonState>()(
  persist(
    (set, get) => ({
      disabledButtons: {},
      setButtonDisabled: (assessmentId, disabled) =>
        set((state) => ({
          disabledButtons: {
            ...state.disabledButtons,
            [assessmentId]: disabled,
          },
        })),
      isButtonDisabled: (assessmentId) => {
        return get().disabledButtons[assessmentId] ?? false;
      },
    }),
    {
      name: "assessment-button-storage",
    }
  )
);
