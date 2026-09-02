import { Request, Response } from "express";
import Question from "../../models/assessment/question.model";
import DescriptiveQuestion from "../../models/assessment/descriptive.model";

//  Create Descriptive Question
export const createDescriptiveQuestion = async (req: Request, res: Response) => {
  try {
    const descriptiveQuestion = await DescriptiveQuestion.create({ ...req.body, questionType: "Descriptive" });
    res.status(201).json({ success: true, data: descriptiveQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

//  Get All Descriptive Questions
export const getAllDescriptiveQuestions = async (req: Request, res: Response) => {
  try {
    const descriptiveQuestions = await Question.find({ questionType: "Descriptive" });
    res.status(200).json({ success: true, data: descriptiveQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

//  Get Single Descriptive Question by ID
export const getDescriptiveQuestionById = async (req: Request, res: Response) => {
  try {
    const descriptiveQuestion = await Question.findOne({ _id: req.params.id, questionType: "Descriptive" });
    if (!descriptiveQuestion) {
       res.status(404).json({ success: false, message: "Descriptive Question not found" });
    
       return;  }
    res.status(200).json({ success: true, data: descriptiveQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

//  Update Descriptive Question
export const updateDescriptiveQuestion = async (req: Request, res: Response) => {
  try {
    const descriptiveQuestion = await Question.findOneAndUpdate(
      { _id: req.params.id, questionType: "Descriptive" },
      req.body,
      { new: true }
    );
    if (!descriptiveQuestion) {
       res.status(404).json({ success: false, message: "Descriptive Question not found" });
      return;
    }
    res.status(200).json({ success: true, data: descriptiveQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

//  Delete Descriptive Question
export const deleteDescriptiveQuestion = async (req: Request, res: Response) => {
  try {
    const descriptiveQuestion = await Question.findOneAndDelete({ _id: req.params.id, questionType: "Descriptive" });
    if (!descriptiveQuestion) {
       res.status(404).json({ success: false, message: "Descriptive Question not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Descriptive Question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
