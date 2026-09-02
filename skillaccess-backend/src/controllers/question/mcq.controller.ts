import { Request, Response } from "express";
import Question from "../../models/assessment/question.model"; // Base Model
import MCQ from "../../models/assessment/mcq.model"; // Discriminator Model

// Create a new MCQ
export const createMCQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const mcq = new MCQ(req.body);
    await mcq.save();
    res.status(201).json({ success: true, data: mcq });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get all MCQs
export const getAllMCQs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const mcqs = await Question.find({ questionType: "mcq" });
    res.status(200).json({ success: true, data: mcqs });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get a single MCQ by ID
export const getMCQById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const mcq = await Question.findOne({
      _id: req.params.id,
      questionType: "mcq",
    });

    if (!mcq) {
      res.status(404).json({ success: false, message: "MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: mcq });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update an MCQ
export const updateMCQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const mcq = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "mcq" },
      req.body,
      { new: true }
    );

    if (!mcq) {
      res.status(404).json({ success: false, message: "MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: mcq });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete an MCQ
export const deleteMCQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const mcq = await Question.findOneAndDelete({
      _id: req.params.id,
      questionType: "mcq",
    });

    if (!mcq) {
      res.status(404).json({ success: false, message: "MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, message: "MCQ deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
