import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Topic from "../../models/assessment/topic.model";
import Question from "../../models/assessment/question.model"; // Import single questions collection
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";
import { College } from "@models/college/college.model";
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}
export const createTopic = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { role, userId } = req.user!;
    if (!["college", "company", "university"].includes(role)) {
      return next(new ErrorHandler("Invalid user role", 403));
    }

    try {
      // Base topic data
      const topicData: any = {
        ...req.body,
        createdByCollege: role === "college",
        createdByCompany: role === "company",
        createdByUniversity: role === "university",
      };

      // Set the correct organization ID based on role
      if (role === "college") {
        topicData.college = userId;
      } else if (role === "company") {
        topicData.company = userId;
      } else if (role === "university") {
        topicData.university = userId;
      }

      const topic = new Topic(topicData);
      await topic.save();

      res.status(201).json({ success: true, topic });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  }
);


export const getAllTopics = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.user!;

    const filter: any = {};

    if (role === "college") {
      filter.college = userId;
    } else if (role === "company") {
      filter.company = userId;
    } else if (role === "university") {
      filter.university = userId;
    }

    const topics = await Topic.find(filter);

    res.json({ success: true, topics });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Get a single topic by ID
 */
export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topic = await Topic.findById(req.params.id).populate("questions");
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }
    res.json({ success: true, topic });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Update a topic
 */
export const updateTopic = async (req: Request, res: Response) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }
    res.json({ success: true, topic });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Delete a topic
 */
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }
    res.json({ success: true, message: "Topic deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Add questions to a topic dynamically
 */
export const addQuestionsToTopic = async (req: Request, res: Response) => {
  try {
    const { questionIds }: { questionIds: string[] } = req.body;
    const topicId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      res.status(400).json({ success: false, message: "Invalid topic ID" });
      return;
    }

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      res.status(400).json({ success: false, message: "Invalid question IDs" });
      return;
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      res.status(404).json({ success: false, message: "Topic not found" });
      return;
    }

    // Find valid questions from the `questions` collection
    const validQuestions = await Question.find({ _id: { $in: questionIds } })
      .select("_id")
      .lean();
    const validQuestionIds = validQuestions.map((q) => q._id.toString());

    if (validQuestions.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "No valid questions found" });
      return;
    }

    // const validQuestionIds = validQuestions.map((q: { _id: mongoose.Types.ObjectId }) => q._id.toString());

    // Add only unique question IDs using `$addToSet`
    await Topic.findByIdAndUpdate(topicId, {
      $addToSet: { questions: { $each: validQuestionIds } },
      $set: {
        totalQuestions: topic.questions.length + validQuestionIds.length,
      },
    });

    const updatedTopic = await Topic.findById(topicId);
    res.json({
      success: true,
      message: "Questions added successfully",
      topic: updatedTopic,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
