export const evaluatePromptAnswer = async ({
  question,
  expectedOutputDescription,
  studentAnswer,
}: {
  question: string;
  expectedOutputDescription: string;
  studentAnswer: string;
}): Promise<number> => {
  console.log("====== MOCKED GPT EVALUATOR ======");
  return 85;
};
