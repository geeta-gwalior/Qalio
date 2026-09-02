// export interface AssessmentData {
//   _id?: string;
//   name?: string;
//   additionalDescription?: string;
//   totalTime?: number;
//   totalMarks?: number;
//   totalQuestionsCount?: number;
//   totalAttempts?: number;
//   attemptCount?: number;
//   status?: string;
//   level?: string;
//   type?: string;
//   startDate?: string;
//   endDate?: string;
//   categoryName?: string;
//   attemptsUsed?: number;
//   createdBy?: {
//     _id: string;
//     name: string;
//     avatar?: string;
//     role?: string;
//     email?: string;
//   };
// }

export type AssessmentData = {
  _id: string;
  name: string;
  attemptsUsed?: number;
  additionalDescription?: string;
  totalTime: number;
  totalMarks: number;
  totalAttempts: number;
  attemptCount: number;
  isTotalDuration: boolean;
  level?: string;
  type?: string;
  status?: string;
  startDate: string;
  endDate: string;
  config: any;
  totalQuestionsCount: number;
  questions: Question[]; // <-- Add this line
  createdBy?: {
    name?: string;
  };
};

export interface BackendAssessment {
  _id: string;
  name: string;
  additionalDescription: string;
  totalTime: number | null;
  totalMarks: number;
  totalAttempts: number;
  attemptCount: number;
  isTotalDuration: boolean;
  level: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalQuestionsCount: number;
  topics: Array<{
    heading: string;
    description: string;
    selectedQuestions: Array<{
      _id: string;
      title: string;
      duration: number;
      totalMarks: number;
      questionType: "mcq" | "mcqmulti" | "findAnswer" | "coding";

      // For MCQ types - only text, no isCorrect flags
      options?: Array<{
        _id?: string;
        text: string;
      }>;

      // For findAnswer type
      passage?: string;
      questions?: Array<{
        _id?: string;
        questionText: string;
        options?: Array<{
          _id?: string;
          text: string;
        }>;
      }>;

      // For coding type - only visible test cases and default code
      codeQuestion?: string;
      code?: {
        [language: string]: {
          defaultCode: string;
        };
      };
      testcase?: Array<{
        input: string;
        expectedOutput: string;
      }>;
    }>;
    _id: string;
  }>;
  config: {
    isCameraRequired: boolean;
    maxTabSwitches: number;
    maxAudioLimitExceedCount: number;
    enableAudioProctoring: boolean;
    enableRandomShuffling: boolean;
    disableCopyPasteInEditor: boolean;
    takeSnapshotsDuringTest: boolean;
    restrictFullscreenMode: boolean;
    logoutOnLeave: boolean;
    isDeveloperToolsBlocked?: boolean;
    restrictedIPs: string[];
    openContest: boolean;
    allowedDevices?: Array<"mobile" | "tablet" | "laptop">; // New field for device restrictions
    instructions: Array<{
      _id: string;
      title: string;
      description: string;
    }>;
    faqs?: Array<{
      _id: string;
      question: string;
      answer: string;
    }>;
  };
}

export interface Question {
  _id: string;
  questionType: "mcq" | "mcqmulti" | "findAnswer" | "coding" | "prompt";
  questionText: string;
  totalMarks: number;
  timeLimit?: number;
  options?: Array<{ text: string; isCorrect?: boolean }>;
  passage?: string;
  questions?: Array<{
    questionText: string;
    options?: Array<{ text: string; isCorrect?: boolean; _id?: string }>;
    _id?: string;
  }>;
  testcase?: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  codeQuestion?: string;
  code?: {
    [language: string]: {
      defaultCode: string;
      solutionCode?: string;
    };
  };
}

export interface AssessmentDetails {
  id: string;
  title: string;
  mascot?: string; // URL to mascot image
  timePeriod?: {
    duration: string;
  };
  timeline?: {
    startDate: string;
    endDate: string;
  };
  studentStats?: {
    appeared: number;
    attempts: number;
  };
  description?: string;
  guidelines?: {
    proctoring?: string[];
    plagiarism?: string[];
    environment?: string[];
    duringTest?: string[];
    finalReminders?: string[];
  };
  overview?: {
    questionCount?: number;
    questionTypes?: string[];
    timeAllocation?: string[];
    additionalInstructions?: string[];
  };
}

export type Option = {
  text: string;
  isCorrect: boolean;
  _id: string;
};

export interface StudentResponse {
  _id: string;
  assessment: string;
  student: string;
  responses: Array<{
    questionId: string;
    answer: any;
    isCorrect?: boolean;
    marksAwarded?: number;
    timeSpent?: number;
    savedAt?: string;
  }>;
  startedAt: string;
  submittedAt?: string;
  totalMarksScored: number;
  status: "in-progress" | "submitted";
  lastSavedAt?: string;
  currentQuestionIndex?: number;
  timeRemaining?: number;
  securityEvents?: Array<{
    type: string;
    timestamp: string;
    details?: any;
  }>;
}

export type SelectedQuestion = {
  questionId: string;
  title: string;
  questionType: string;
  totalMarks: number;
  _id: string;
  topic?: string;
  options?: Option[];
  passage?: string;
  expectedOutputDescription?: string;
  questions?: {
    _id: string;
    questionText: string;
    options: Option[];
  }[];
  codeQuestion?: string;
  duration?: number;
};

export type FormTestTopic = {
  _id: string;
  heading: string;
  description: string;
  icon?: string;
  type: string;
  questionCount?: number;
  duration?: string;
  questionType?: string;
  questions: SelectedQuestion[];
};

export type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};

export type SavedTestCase = {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
};
export type SavedTestCaseLanguage = {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
  language: string;
};

export type CodeQuestion = {
  id: string;
  number: number;
  title: string;
  questionTopic?: string;
  language: string;
  timeLimit: string;
  questionLevel: "beginner" | "intermediate" | "advanced";
  totalMarks: number;
  codeQuestion: string;
  parameters: string[];
  returnType: string;
  code: {
    [language: string]: {
      defaultCode: string;
      solutionCode: string;
    };
  };
  testcase: TestCase[];
  totalTestCases: number;
  questionType: "coding";
  generatedDriverCode: boolean;
};
