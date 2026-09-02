import { Request, Response } from "express";
import Question from "../../models/assessment/question.model";
import FindAnswer from "../../models/assessment/findAnswer.model";

// ✅ Create Find Answer Question
export const createFindAnswer = async (req: Request, res: Response) => {
  try {
    const findAnswer = await FindAnswer.create({ ...req.body, questionType: "findAnswer" });
    res.status(201).json({ success: true, data: findAnswer });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Get All Find Answer Questions
export const getAllFindAnswers = async (req: Request, res: Response) => {
  try {
    const findAnswers = await Question.find({ questionType: "FindAnswer" });
    res.status(200).json({ success: true, data: findAnswers });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Get Single Find Answer Question by ID
export const getFindAnswerById = async (req: Request, res: Response) => {
  try {
    const findAnswer = await Question.findOne({ _id: req.params.id, questionType: "FindAnswer" });
    if (!findAnswer) {
      res.status(404).json({ success: false, message: "Find Answer question not found" });
      return;
    }
    res.status(200).json({ success: true, data: findAnswer });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Update Find Answer Question
export const updateFindAnswer = async (req: Request, res: Response) => {
  try {
    const findAnswer = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "FindAnswer" },
      req.body,
      { new: true }
    );
    if (!findAnswer) {
      res.status(404).json({ success: false, message: "Find Answer question not found" });
      return;
    }
    res.status(200).json({ success: true, data: findAnswer });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete Find Answer Question
export const deleteFindAnswer = async (req: Request, res: Response) => {
  try {
    const findAnswer = await Question.findOneAndDelete({ _id: req.params.id, questionType: "FindAnswer" });
    if (!findAnswer) {
       res.status(404).json({ success: false, message: "Find Answer question not found" });
       return;
    }
    res.status(200).json({ success: true, message: "Find Answer question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
