import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Question from "../../models/assessment/question.model";
import FindAnswer from "../../models/assessment/findAnswer.model";
import DescriptiveQuestion from "../../models/assessment/descriptive.model";
import Coding from "../../models/assessment/coding.model";
import MCQ from "../../models/assessment/mcq.model";
import Topic from "../../models/assessment/topic.model"; // Import Topic model
import MCQMulti from "../../models/assessment/multi-mcq.model";
import Prompt from "../../models/assessment/prompt.model";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}
const questionTypes: { [key: string]: any } = {
  findAnswer: FindAnswer,
  descriptive: DescriptiveQuestion,
  coding: Coding,
  mcq: MCQ,
  mcqmulti: MCQMulti,
  prompt: Prompt,
};

/**
 * Create a new question and add it to the topic
 */
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { questionType, topicId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      res.status(400).json({ success: false, message: "Invalid topic ID" });
      return;
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }

    const Model = questionTypes[questionType];
    if (!Model) {
      res
        .status(400)
        .json({ success: false, message: "Invalid question type" });
      return;
    }

    //  Create and save the question
    const question = new Model(req.body);
    await question.save();

    //  Add question to topic if not already present
    if (topic && !topic.questions.includes(question._id.toString())) {
      await Topic.findByIdAndUpdate(topicId, {
        $addToSet: { questions: question._id }, // Ensures no duplicates
        $inc: { totalQuestions: 1 }, // Increment total questions count
      });
    }

    res.status(201).json({
      success: true,
      message: "Question created and added to topic",
      data: question,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
/**
 * Upload multiple questions to a topic
 */
export const uploadMultipleQuestions = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { role, userId } = req.user!;
    if (!["college", "company", "university"].includes(role)) {
      return next(new ErrorHandler("Invalid user role", 403));
    }

    try {
      const { questions, topicId } = req.body;

      // Validate input
      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          message: "questions should be an array and not empty",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        res.status(400).json({ success: false, message: "Invalid topic ID" });
      }

      const topic = await Topic.findById(topicId);
      if (!topic) {
        res.status(404).json({ success: false, message: "Topic not found" });
      }

      const savedQuestions = [];

      for (const questionData of questions) {
        const { questionType } = questionData;

        const Model = questionTypes[questionType];
        if (!Model) {
          res.status(400).json({
            success: false,
            message: `Invalid question type: ${questionType}`,
          });
        }

        // Ensure topicId is included in the document
        const question = new Model({
          ...questionData,
          topicId,
          topic: topicId,
          createdBy: userId,
        });

        await question.save();
        savedQuestions.push(question);

        // Add question to topic if not already present
        if (!topic?.questions.includes(question._id.toString())) {
          await Topic.findByIdAndUpdate(topicId, {
            $addToSet: { questions: question._id },
            $inc: { totalQuestions: 1 },
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `${savedQuestions.length} question(s) uploaded and added to the topic`,
        data: savedQuestions,
      });
    } catch (error) {
      console.error("Error uploading multiple questions:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to upload questions" });
    }
  }
);

/**
 * Get all questions, optionally filtered by type
 */
export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    let questions;
    if (type && questionTypes[type as string]) {
      questions = await questionTypes[type as string].find();
    } else {
      questions = await Question.find();
    }

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
/**
 * Get a question by ID
 */
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
/**
 * Update a question by ID dynamically based on type
 */
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!question) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Delete a question by ID
 */
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
