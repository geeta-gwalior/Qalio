import { Request, Response } from "express";
import Question from "../../models/assessment/question.model";
import Coding from "../../models/assessment/coding.model";

// ✅ Create Coding Question
export const createCodingQuestion = async (req: Request, res: Response) => {
  try {
    const codingQuestion = await Coding.create({ ...req.body, questionType: "Coding" });
    res.status(201).json({ success: true, data: codingQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Get All Coding Questions
export const getAllCodingQuestions = async (req: Request, res: Response) => {
  try {
    const codingQuestions = await Question.find({ questionType: "Coding" });
    res.status(200).json({ success: true, data: codingQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Get Single Coding Question by ID
export const getCodingQuestionById = async (req: Request, res: Response) => {
  try {
    const codingQuestion = await Question.findOne({ _id: req.params.id, questionType: "Coding" });
    if (!codingQuestion) {
       res.status(404).json({ success: false, message: "Coding Question not found" });
       return
    }
    res.status(200).json({ success: true, data: codingQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Update Coding Question
export const updateCodingQuestion = async (req: Request, res: Response) => {
  try {
    const codingQuestion = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "Coding" },
      req.body,
      { new: true }
    );
    if (!codingQuestion) {
       res.status(404).json({ success: false, message: "Coding Question not found" });
       return
    }
    res.status(200).json({ success: true, data: codingQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ✅ Delete Coding Question


export const deleteCodingQuestion = async (req: Request, res: Response) => {
  try {
    const codingQuestion = await Question.findOneAndDelete({ _id: req.params.id, questionType: "Coding" });
    if (!codingQuestion) {
       res.status(404).json({ success: false, message: "Coding Question not found" });
       return;
    }
    res.status(200).json({ success: true, message: "Coding Question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
