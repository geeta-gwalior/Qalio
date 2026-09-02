import { Request, Response } from "express";
import Question from "../../models/assessment/question.model"; // Base Model
import Prompt from "../../models/assessment/prompt.model"; // Discriminator

// Create a new Prompt question
export const createPromptQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promptQuestion = new Prompt(req.body);
    await promptQuestion.save();
    res.status(201).json({ success: true, data: promptQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get all Prompt questions
export const getAllPromptQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prompts = await Question.find({ questionType: "prompt" });
    res.status(200).json({ success: true, data: prompts });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get a single Prompt question by ID
export const getPromptQuestionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prompt = await Question.findOne({
      _id: req.params.id,
      questionType: "prompt",
    });

    if (!prompt) {
      res
        .status(404)
        .json({ success: false, message: "Prompt question not found" });
      return;
    }

    res.status(200).json({ success: true, data: prompt });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update a Prompt question
export const updatePromptQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prompt = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "prompt" },
      req.body,
      { new: true }
    );

    if (!prompt) {
      res
        .status(404)
        .json({ success: false, message: "Prompt question not found" });
      return;
    }

    res.status(200).json({ success: true, data: prompt });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete a Prompt question
export const deletePromptQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const prompt = await Question.findOneAndDelete({
      _id: req.params.id,
      questionType: "prompt",
    });

    if (!prompt) {
      res
        .status(404)
        .json({ success: false, message: "Prompt question not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Prompt question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
