import { Request, Response } from "express";
import Video from "../../models/assessment/video.model"; // Import Video model

// Create a new Video Question
export const createVideoQuestion = async (req: Request, res: Response) => {
  try {
    const videoQuestion = new Video(req.body);
    await videoQuestion.save();
    res.status(201).json({ success: true, data: videoQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get all Video Questions
export const getAllVideoQuestions = async (req: Request, res: Response) => {
  try {
    const videoQuestions = await Video.find();
    res.status(200).json({ success: true, data: videoQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Get a single Video Question by ID
export const getVideoQuestionById = async (req: Request, res: Response) => {
  try {
    const videoQuestion = await Video.findById(req.params.id);
    if (!videoQuestion) {
       res.status(404).json({ success: false, message: "Video Question not found" });
       return;
    }
    res.status(200).json({ success: true, data: videoQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Update a Video Question
export const updateVideoQuestion = async (req: Request, res: Response) => {
  try {
    const videoQuestion = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!videoQuestion) {
       res.status(404).json({ success: false, message: "Video Question not found" });
       return;
    }
    res.status(200).json({ success: true, data: videoQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Delete a Video Question
export const deleteVideoQuestion = async (req: Request, res: Response) => {
  try {
    const videoQuestion = await Video.findByIdAndDelete(req.params.id);
    if (!videoQuestion) {
       res.status(404).json({ success: false, message: "Video Question not found" });
       return;
    }
    res.status(200).json({ success: true, message: "Video Question deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
