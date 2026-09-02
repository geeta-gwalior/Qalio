import { Request, Response, NextFunction } from "express";
import { evaluatePromptAnswer } from "../utils/gptPromptEvaluator";

export const testPromptEvaluation = async (req: Request, res: Response) => {
  console.log("Here we go");

  try {
    const { question, expectedOutputDescription, studentAnswer } = req.body;

    console.log("🧪 Question:", question);
    console.log("🧪 Expected Output:", expectedOutputDescription);
    console.log("🧪 Student Answer:", studentAnswer);

    if (!question || !expectedOutputDescription || !studentAnswer) {
      res.status(400).json({ success: false, message: "Missing fields" });
      return;
    }

    const score = await evaluatePromptAnswer({
      question,
      expectedOutputDescription,
      studentAnswer,
    });

    res.status(200).json({
      success: true,
      score,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "GPT evaluation failed",
    });
  }
};
