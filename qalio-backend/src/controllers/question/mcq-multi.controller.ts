import { Request, Response } from "express";
import Question from "../../models/assessment/question.model"; // Base Model
import MCQMulti from "../../models/assessment/multi-mcq.model"; // Discriminator Model

// Create a new Multi-MCQ
export const createMultiMCQ = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const multiMCQ = new MCQMulti(req.body);
    await multiMCQ.save();
    res.status(201).json({ success: true, data: multiMCQ });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get all Multi-MCQs
export const getAllMultiMCQs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const multiMCQs = await Question.find({ questionType: "multi-mcq" });
    res.status(200).json({ success: true, data: multiMCQs });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get a single Multi-MCQ by ID
export const getMultiMCQById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const multiMCQ = await Question.findOne({
      _id: req.params.id,
      questionType: "multi-mcq",
    });

    if (!multiMCQ) {
      res.status(404).json({ success: false, message: "Multi-MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: multiMCQ });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update a Multi-MCQ
export const updateMultiMCQ = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updated = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "multi-mcq" },
      req.body,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: "Multi-MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete a Multi-MCQ
export const deleteMultiMCQ = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deleted = await Question.findOneAndDelete({
      _id: req.params.id,
      questionType: "multi-mcq",
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: "Multi-MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Multi-MCQ deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
