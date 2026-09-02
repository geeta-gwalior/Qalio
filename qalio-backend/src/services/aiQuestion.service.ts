import { AIQuestion, QuestionLevel, QuestionType } from "../types/questionSchema";

// Mocked AI generation
export const generateAIQuestion = async (
  subject: string,
  level: QuestionLevel,
  type: QuestionType = "mcq",
  count: number = 2, // Number of questions to generate
  duration: number = 1, // Default duration in seconds
  totaMarks: number = 1, // Default total marks for the question
  words: number = 12, // Default word count for descriptive questions
  subquestions: number = 2 // Default number of sub-questions for findAnswer type
): Promise<AIQuestion[]> => {
  let exampleFormat = "";
  // Same switch statement for exampleFormat
  switch (type) {
    case "mcq":
      exampleFormat = `{
        "title": "[MOCK] What is 2 + 2? (${subject})",
        "options": [
          { "text": "3", "isCorrect": false },
          { "text": "4", "isCorrect": true },
          { "text": "5", "isCorrect": false },
          { "text": "6", "isCorrect": false }
        ],
        "duration": ${duration},
        "totalMarks": ${totaMarks},
        "subject": "${subject}",
        "level": "${level}",
        "type": "mcq"
      }`;
      break;

    case "mcqmulti":
      exampleFormat = `{
          "title": "[MOCK] Which of the following are programming languages? (${subject})",
          "options": [
            { "text": "Python", "isCorrect": true },
            { "text": "HTML", "isCorrect": false },
            { "text": "Java", "isCorrect": true },
            { "text": "CSS", "isCorrect": false }
          ],
          "duration": ${duration},
          "totalMarks": ${totaMarks},
          "subject": "${subject}",
          "level": "${level}",
          "type": "mcqmulti"
        }`;
      break;

    case "findAnswer":
      exampleFormat = `{
        "title": "[MOCK] Reading Comprehension on Climate Change",
        "passage": "Climate change refers to long-term shifts in temperatures and weather patterns...",
        "questions": [
          {
            "questionText": "What is the main cause of climate change since the 1800s?",
            "options": [
              { "text": "Volcanic eruptions", "isCorrect": false },
              { "text": "Solar cycles", "isCorrect": false },
              { "text": "Human activities", "isCorrect": true },
              { "text": "Tectonic shifts", "isCorrect": false }
            ]
          }
        ],
        "duration": ${duration},
        "totalMarks": ${totaMarks},
        "subject": "${subject}",
        "level": "${level}",
        "type": "findAnswer"
      }`;
      break;

    case "descriptive":
      exampleFormat = `{
  "question": "[MOCK] Explain this concept.",
  "expectedAnswer": "This is a mocked expected answer.",
  "title": "[MOCK] Descriptive Question",
  "duration": ${duration},
  "subject": "${subject}",
  "level": "${level}",
  "type": "descriptive"
}`;
      break;

    case "coding":
      exampleFormat = `{
  "question": "[MOCK] Write a function.",
  "instructions": "Mock instructions.",
  "answersByLanguage": {
    "python": "def mocked(): pass",
    "java": "class Mocked {}",
    "cpp": "int main() { return 0; }"
  },
  "title": "[MOCK] Coding Question",
  "duration": ${duration},
  "subject": "${subject}",
  "level": "${level}",
  "type": "coding"
}`;
      break;
    case "prompt":
      exampleFormat = `{
    "title": "[MOCK] Explain the importance of sleep",
    "expectedOutputDescription": "Mock expected output description.",
    "duration": ${duration},
    "totalMarks": ${totaMarks},
    "subject": "${subject}",
    "level": "${level}",
    "type": "prompt"
  }`;
      break;

    default:
      throw new Error(`Unsupported question type: ${type}`);
  }

  console.log("====== MOCKED AI QUESTION GENERATOR ======");
  console.log("Generating", count, type, "questions for", subject);
  
  const parsed = JSON.parse(exampleFormat);
  return Array.from({ length: count }, () => ({ ...parsed, title: parsed.title + " " + Math.random().toString(36).substring(7) }));
};
