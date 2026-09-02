// store/useSelectedDataStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SelectedQuestion,FormTestTopic } from "@/types/assessment";

type SelectedDataState = {
  selectedTopics: FormTestTopic[];
  questions: SelectedQuestion[];

  addOrUpdateTopic: (topic: FormTestTopic) => void;
  removeTopic: (id: string, type: string) => void;

  // Changed to accept array of questions
  addOrUpdateQuestions: (questions: SelectedQuestion[], topicId: string, questionType: string) => void;
  getQuestionsForTopic: (topicId: string, questionType: string) => SelectedQuestion[];
  reset: () => void
};

export const useSelectedDataStore = create<SelectedDataState>()(
  persist(
    (set, get) => ({
      selectedTopics: [],
      questions: [],

      addOrUpdateTopic: (newTopic) => {
        set((state) => {
          const existingIndex = state.selectedTopics.findIndex(
            (t) => t._id === newTopic._id && t.questionType === newTopic.questionType
          );

          const updatedTopics = [...state.selectedTopics];
          if (existingIndex !== -1) {
            updatedTopics[existingIndex] = newTopic;
          } else {
            updatedTopics.push(newTopic);
          }

          return { selectedTopics: updatedTopics };
        });
      },

      removeTopic: (id, type) => {
        set((state) => ({
          selectedTopics: state.selectedTopics.filter(
            (t) => !(t._id === id && t.questionType === type)
          ),
          questions: state.questions.filter(
            (q) => !(q.topic === id && q.questionType === type)
          ),
        }));
      },

      addOrUpdateQuestions: (questions, topicId, questionType) => {
        set((state) => {
          // Ensure all questions have the topic and questionType
          const questionsWithTopic = questions.map(q => ({
            ...q,
            topic: topicId,
            questionType
          }));

          const otherQuestions = state.questions.filter(
            (q) => !(q.topic === topicId && q.questionType === questionType)
          );

          return {
            questions: [...otherQuestions, ...questionsWithTopic],
          };
        });
      },

      getQuestionsForTopic: (topicId, questionType) => {
        const state = get();
        return state.questions.filter(
          (q) => q.topic === topicId && q.questionType === questionType
        );
      },
      reset: () => {
        set(() => ({
          selectedTopics: [],
          questions: [],
        }));
        localStorage.removeItem("selected-assessment-data");
      },
    }),
    {
      name: "selected-assessment-data",
    }
  )
);