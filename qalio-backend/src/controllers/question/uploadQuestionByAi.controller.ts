import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { generateAIQuestion } from "../../services/aiQuestion.service";
import Question from "../../models/assessment/question.model";
import { QuestionLevel, QuestionType } from "types/questionSchema";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";
import Topic from "../../models/assessment/topic.model";
import FindAnswer from "../../models/assessment/findAnswer.model";
import DescriptiveQuestion from "../../models/assessment/descriptive.model";
import Coding from "../../models/assessment/coding.model";
import MCQ from "../../models/assessment/mcq.model";
import MCQMulti from "../../models/assessment/multi-mcq.model";
import Prompt from "../../models/assessment/prompt.model";
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}

export const questionTypes: Record<string, any> = {
  mcq: MCQ,
  mcqmulti: MCQMulti,
  findAnswer: FindAnswer,
  descriptive: DescriptiveQuestion,
  coding: Coding,
  prompt: Prompt,
};
export const uploadQuestionByAI = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const {
    subject,
    level,
    type,
    count = 1,
    topicId,
    duration,
    totalMarks,
    words,
    subquestions,
  } = req.body;
  const { role, userId } = req.user!;

  if (!["college", "company", "university"].includes(role)) {
    next(new ErrorHandler("Invalid user role", 403));
  }

  if (!subject || !level || !type || !topicId) {
    res
      .status(400)
      .json({ error: "subject, level, type, and topicId are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    res.status(400).json({ error: "Invalid topic ID" });
  }

  const topic = await Topic.findById(topicId);
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
  }

  try {
    const aiQuestions = await generateAIQuestion(
      subject,
      level,
      type,
      count,
      duration,
      totalMarks,
      words,
      subquestions
    );

    const savedQuestions = [];

    for (const rawQuestion of aiQuestions) {
      const Model = questionTypes[rawQuestion.type]; // Make sure `rawQuestion.type` is consistent with your keys
      if (!Model) {
        res.status(400).json({
          success: false,
          message: `Invalid question type: ${rawQuestion.type}`,
        });
      }

      const questionDoc = new Model({
        ...rawQuestion,
        topic: topicId,
        createdBy: userId,
        totalMarks: rawQuestion.totalMarks || 1,
        duration: duration,
      });

      await questionDoc.save();
      savedQuestions.push(questionDoc);

      await Topic.findByIdAndUpdate(topicId, {
        $addToSet: { questions: questionDoc._id },
        $inc: { totalQuestions: 1 },
      });
    }

    res.status(201).json({
      success: true,
      message: `${savedQuestions.length} AI-generated question(s) uploaded`,
      data: savedQuestions,
    });
  } catch (error) {
    console.error("Error uploading AI-generated questions:", error);
    res.status(500).json({ error: "Failed to upload AI-generated questions" });
  }
};
export const generateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  // const subject = (req.query.subject as string) || 'math';
  // const level = (req.query.level as QuestionLevel) || 'beginner';
  // const type = (req.query.type as QuestionType) || 'mcq';
  // const count = parseInt(req.query.count as string, 10);
  const {
    subject,
    level,
    type,
    count = 1,
    topicId,
    duration,
    totalMarks,
    words,
    subquestions,
  } = req.body;

  try {
    const questions = await generateAIQuestion(
      subject,
      level,
      type,
      count,
      duration,
      totalMarks,
      words,
      subquestions
    );
    res.status(200).json(questions);
    
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
};
