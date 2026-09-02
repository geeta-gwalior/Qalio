import { Request, Response, NextFunction } from "express";
import Assessments from "../../models/assessment/assessment.model";
import Topic from "../../models/assessment/topic.model";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";
import { IQuestion } from "../../models/assessment/question.model"; // Import the Question interface
import Question from "../../models/assessment/question.model"; // Import Question model
import { Student } from "@models/student/student.model";
import { College } from "../../models/college/college.model";
import { University } from "../../models/university/university.model";
import { Company } from "../../models/company/company.model";
import studentResponseModel from "../../models/assessment/studentResponse.model";
import mongoose, { Types } from "mongoose";
import { BaseUser } from "../../models/user/baseUser.model";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}

export const createAssessment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { role, userId } = req.user!;
    if (!["college", "company", "university"].includes(role)) {
      return next(new ErrorHandler("Invalid user role", 403));
    }

    const {
      name,
      additionalDescription,
      level,
      topics,
      startDate,
      endDate,
      totalDuration,
      isNegativeMarking,
      attempts,
      isTotalDuration,
    } = req.body;

    // Check if assessment with the same name exists
    const existingAssessment = await Assessments.findOne({
      name,
      createdBy: userId,
    });
    if (existingAssessment) {
      return next(
        new ErrorHandler(`Assessment with name "${name}" already exists`, 400)
      );
    }

    // Process selected topics
    const selectedTopics = await Promise.all(
      topics.map(
        async (topic: {
          _id: string;
          totalQuestions?: number;
          questions: string[];
        }) => {
          const section = await Topic.findById(topic._id);
          if (!section) {
            throw new ErrorHandler(
              `Topic (Topic) with ID ${topic._id} not found`,
              404
            );
          }

          const questionIds = topic.questions.map((q: any) =>
            typeof q === "string" ? q : q.questionId
          );

          const questions: IQuestion[] = await Question.find({
            _id: { $in: questionIds },
          });

          const selectedQuestions = questions.map((q) => ({
            questionId: q._id,
            title: q.title,
            duration: q.duration,
            questionLevel: q.questionLevel,
            questionType: q.questionType,
            totalMarks: q.totalMarks,
          }));
          return {
            sectionId: section._id,
            heading: section.heading,
            description: section.description,
            totalQuestions: selectedQuestions.length,
            selectedQuestions,
          };
        }
      )
    );

    // Calculate total marks and total questions count
    const totalMarks = selectedTopics.reduce(
      (sum, topic) =>
        sum +
        topic.selectedQuestions.reduce(
          (s: number, q: { totalMarks?: number }) => s + (q.totalMarks || 0),
          0
        ),
      0
    );
    const totalQuestionsCount = selectedTopics.reduce(
      (sum, topic) => sum + topic.selectedQuestions.length,
      0
    );

    // Create assessment
    const assessment = await Assessments.create({
      name,
      additionalDescription,
      level,
      topics: selectedTopics,
      startDate,
      endDate,
      totalQuestionsCount,
      totalTime: totalDuration,
      totalMarks,
      isNegativeMarking: isNegativeMarking,
      createdBy: userId,
      createdByCompany: role === "company",
      createdByUniversity: role === "university",
      createdByCollege: role === "college",
      totalAttempts: attempts,
      isTotalDuration,
    });
    // console.log("Assessment created successfully:", assessment);
    if (role === "college") {
      await College.findOneAndUpdate(
        { userId: userId },
        { $addToSet: { assessments: assessment._id } }
      );
    } else if (role === "university") {
      await University.findOneAndUpdate(
        { userId: userId },
        { $addToSet: { assessments: assessment._id } }
      );
    } else if (role === "company") {
      await Company.findOneAndUpdate(
        { userId: userId },
        { $addToSet: { assessments: assessment._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      assessment,
    });
  }
);

export const getAllAssessments = async (req: Request, res: Response) => {
  const allAssessments = await Assessments.find();
  if (!allAssessments) {
    res.status(404).json({
      sucess: false,
      message: "Did not find any Assessment in the Database",
    });
  }
  res.status(200).json({
    success: true,
    message: "All assessments fetched",
    allAssessments,
  });
};

export const getAssessmentsByCreator = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;

    let query: any = {
      createdBy: userId,
    };

    if (role === "company") {
      query.createdByCompany = true;
    } else if (role === "college") {
      query.createdByCollege = true;
    } else if (role === "university") {
      query.createdByUniversity = true;
    } else if (role === "admin") {
      // Admin can see all assessments
      query = {};
    } else {
      return next(new ErrorHandler("Unauthorized access", 403));
    }

    const assessments = await Assessments.find(query);

    res.status(200).json({
      success: true,
      message: "Assessments fetched for logged-in user",
      assessments,
    });
  }
);

// export const getAssessmentById = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id } = req.params;

//     const assessment = await Assessments.findById(id).populate(
//       "topics.selectedQuestions.questionId"
//     );

//     if (!assessment) {
//       return next(new ErrorHandler("Assessment not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       message: "Specific Assessment fetched successfully",
//       assessment,
//     });
//   }
// );

export const getAssessmentById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const assessment = await Assessments.findById(id).populate(
      "topics.selectedQuestions.questionId"
    );

    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    const assessmentObj = assessment.toObject();

    assessmentObj.topics = assessmentObj.topics.map((topic: any) => {
      topic.selectedQuestions = topic.selectedQuestions.map((sq: any) => {
        const question = sq.questionId;

        if (!question) {
          // Fallback if question not populated
          return {
            _id: sq._id,
            title: sq.title,
            totalMarks: sq.totalMarks,
            duration: sq.duration,
            questionType: sq.questionType,
            questionLevel: sq.questionLevel,
            options: [],
          };
        }

        switch (question.questionType) {
          case "mcq":
          case "mcqmulti":
            // For MCQ types, return title and options text only
            return {
              _id: question._id,
              title: question.title,
              duration: question.duration,
              totalMarks: question.totalMarks,
              questionType: question.questionType,
              questionLevel: question.questionLevel,
              options: (question.options || []).map((opt: any) => ({
                _id: opt._id,
                text: opt.text,
              })),
            };

          case "findAnswer":
            // For findAnswer type, return passage and embedded questions without answers
            return {
              _id: question._id,
              title: question.title || "",
              duration: question.duration,
              totalMarks: question.totalMarks,
              questionType: question.questionType,
              questionLevel: question.questionLevel,
              passage: question.passage,
              questions: (question.questions || []).map((q: any) => ({
                questionText: q.questionText,
                options: (q.options || []).map((opt: any) => ({
                  _id: opt._id,
                  text: opt.text,
                })),
              })),
            };

          case "coding":
            return {
              _id: question._id,
              title: question.title || "",
              duration: question.duration,
              totalMarks: question.totalMarks,
              questionType: question.questionType,
              codeQuestion: question.codeQuestion,
              questionLevel: question.questionLevel,
              testcase: (question.testcase || [])
                .filter((tc: any) => !tc.isHidden)
                .map((tc: any) => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                })),
              code: question.code
                ? Object.entries(question.code).reduce(
                    (acc: any, [lang, codeObj]: any) => {
                      acc[lang] = { defaultCode: codeObj.defaultCode };
                      return acc;
                    },
                    {}
                  )
                : {},
            };

          case "prompt":
            return {
              _id: question._id,
              title: question.title || "",
              duration: question.duration,
              totalMarks: question.totalMarks,
              questionType: question.questionType,
              questionLevel: question.questionLevel,
              expectedOutputDescription: question.expectedOutputDescription,
            };

          default:
            // Default fallback: return title only
            return {
              _id: question._id,
              title: question.title || "",
              totalMarks: question.totalMarks,
              duration: question.duration,
              questionType: question.questionType,
              questionLevel: question.questionLevel,
            };
        }
      });

      return topic;
    });

    res.status(200).json({
      success: true,
      message: "Specific Assessment fetched successfully",
      assessment: assessmentObj,
    });
  }
);

export const updateAssessmentById = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;
    const { userId } = req.user!;
    // Prepare the update object
    const updateObj: any = { $set: {} };
    if (updateData.selectAllApproved) {
      const collegeId = userId; // Use userId from req.user
      const college = await College.findOne({ userId: collegeId })
        .populate("students")
        .exec();

      if (!college) {
        return next(new ErrorHandler("College not found", 404));
      }

      const userIds = college.students.map((user: any) => user._id.toString());
      updateObj.$set.invitedStudents = userIds;
    }
    // Handle top-level fields
    if (updateData.totalTime) {
      updateObj.$set.totalTime = updateData.totalTime;
    }
    if (updateData.invitedStudents) {
      updateObj.$set.invitedStudents = updateData.invitedStudents;
    }
    // Handle config updates
    if (updateData.config) {
      Object.entries(updateData.config).forEach(([key, value]) => {
        updateObj.$set[`config.${key}`] = value;
      });
    }
    if (updateData.selectedStudents) {
      // Convert single student to array for consistent handling
      const studentsToAdd = Array.isArray(updateData.selectedStudents)
        ? updateData.selectedStudents
        : [updateData.selectedStudents];

      // Use $addToSet to avoid duplicates
      updateObj.$addToSet = {
        selectedStudents: { $each: studentsToAdd },
      };
    }

    // Perform the update
    const updatedAssessment = await Assessments.findByIdAndUpdate(
      id,
      updateObj,
      { new: true, runValidators: true } // Return updated doc and validate
    );

    if (!updatedAssessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      updatedAssessment,
    });
  }
);

// export const getAssessmentsForInvitedStudent = catchAsyncErrors(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const studentId = req.user?.userId;

//     if (!studentId) {
//       return next(new ErrorHandler("Student ID is required", 400));
//     }

//     const assessments = await Assessments.find({
//       invitedStudents: studentId,
//     })
//       .populate("topics.selectedQuestions.questionId")
//       .populate("createdBy");

//     res.status(200).json({
//       success: true,
//       message: "Assessments invited for this student fetched successfully",
//       assessments,
//     });
//   }
// );

export const getAssessmentsForInvitedStudent = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const studentId = req.user?.userId;
    console.log("Entered here", studentId);

    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    // Step 1: Find assessments where this student is invited
    const assessments = await Assessments.find({
      invitedStudents: studentId,
    })
      .select(
        "_id name additionalDescription totalTime totalMarks totalQuestionsCount totalAttempts attemptCount status level type startDate endDate categoryName createdBy"
      )
      .populate({
        path: "createdBy",
        select: "name email phone avatar address role",
      })
      .sort({ createdAt: -1 })
      .lean();

    const assessmentIds = assessments.map((a) => a._id);

    // Step 2: Count number of submissions per assessment by this student
    const attemptCounts = await studentResponseModel.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          assessment: { $in: assessmentIds },
          status: "submitted", // Only count completed submissions
        },
      },
      {
        $group: {
          _id: "$assessment",
          attemptsUsed: { $sum: 1 },
        },
      },
    ]);

    // Step 3: Map the counts by assessment ID
    const attemptMap = new Map(
      attemptCounts.map((item) => [item._id.toString(), item.attemptsUsed])
    );

    // Step 4: Merge count info into assessment results
    const enriched = assessments.map((assessment) => {
      const attemptsUsed = attemptMap.get(assessment._id.toString()) || 0;
      return {
        ...assessment,
        attemptsUsed,
      };
    });

    res.status(200).json({
      success: true,
      message: "Invited assessments with attempts count",
      assessments: enriched,
    });
  }
);
// export const getAssessmentResultById = catchAsyncErrors(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { id } = req.params;
//     const collegeId = req.user?.userId;

//     if (!collegeId) {
//       return next(new ErrorHandler("College ID is required", 400));
//     }

//     // Step 1: Find assessment by ID
//     const assessment = await Assessments.findById(id).lean();
//     if (!assessment) {
//       return next(new ErrorHandler("Assessment not found", 404));
//     }

//     const appearedStudentIds = assessment.appearedStudents || [];

//     // Convert to ObjectIds if needed
//     const studentObjectIds = appearedStudentIds.map(
//       (sid) => new mongoose.Types.ObjectId(sid)
//     );

//     // Step 2: Fetch all student responses for this assessment and these students, with populated student -> baseUser
//     const studentResponses = await studentResponseModel
//       .find({ assessment: id })
//       .populate({
//         path: "student",
//         model: "BaseUser", // ✅ make sure this matches your model name
//         select: "name email", // optional
//       })
//       .lean();

//     console.log(
//       "Student Responses Fetched",
//       studentResponses.length,
//       "responses found for assessment",
//       id
//     );
//     console.log("Student Responses:", studentResponses);

//     // Step 3: Find top scoring attempt per student in JS
//     const topScoresMap = new Map();
//     let x = 1;
//     for (const resp of studentResponses) {
//       if (!resp.student) {
//         console.warn("Skipping response without student", resp._id);
//         x++;
//         continue;
//       }
//       console.log("x value", x);
//       const studentId = resp.student._id.toString();
//       //  console.log("Processing response for Student", studentId, "Response ID:", resp._id);
//       // rest same

//       const currentTop = topScoresMap.get(studentId);
//       console.log("Current Top Score for Student", studentId, currentTop);
//       if (
//         !currentTop ||
//         (resp.totalMarksScored || 0) > (currentTop.totalMarksScored || 0)
//       ) {
//         topScoresMap.set(studentId, resp);
//       }
//     }
//     console.log("x2", x);

//     const resultList = Array.from(topScoresMap.values()).map((resp) => ({
//       studentId: resp.student._id,
//       name: resp.student.name || "Unknown",
//       email: resp.student.email || "Unknown",
//       totalMarksScored: resp.totalMarksScored,
//       submittedAt: resp.submittedAt,

//     }));
//     console.log("End Debug part");

//     // const rawResponses = await studentResponseModel
//     //   .find({ assessment: id })
//     //   .lean();
//     // console.log(rawResponses.map((r) => ({ _id: r._id, student: r.student })));

//     res.status(200).json({
//       success: true,
//       message: "Assessment results fetched successfully!",
//       assessment,
//       studentResponses, // all attempts
//       resultList,
//       // best attempt per student
//     });
//   }
// );

export const getAssessmentResultById = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const collegeId = req.user?.userId;

    if (!collegeId) {
      return next(new ErrorHandler("College ID is required", 400));
    }

    const assessment = await Assessments.findById(id).lean();
    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    const appearedStudentIds = assessment.appearedStudents || [];
    const selectedStudentIds = assessment.selectedStudents || [];

    const studentResponses = await studentResponseModel
      .find({ assessment: id })
      .populate({
        path: "student",
        model: "BaseUser",
        select: "name email avatar",
      })
      .lean();

    // Step 1: Top Scoring Attempt Per Student
    const topScoresMap = new Map();
    for (const resp of studentResponses) {
      if (!resp.student) continue;
      const studentId = resp.student._id.toString();
      const currentTop = topScoresMap.get(studentId);
      if (
        !currentTop ||
        (resp.totalMarksScored || 0) > (currentTop.totalMarksScored || 0)
      ) {
        topScoresMap.set(studentId, resp);
      }
    }

    // Step 2: Build resultList (only appeared students)
    const resultList = Array.from(topScoresMap.values()).map((resp) => ({
      studentId: resp.student._id,
      name: resp.student.name || "Unknown",
      email: resp.student.email || "Unknown",
      totalMarksScored: resp.totalMarksScored,
      submittedAt: resp.submittedAt,
      evaluatedStatus: resp.evaluatedStatus,
      avatar: resp.student.avatar,
    }));

    // Step 3: Fetch all selected students (shortlisted) and join with topScoresMap if response exists
    const shortlistedBaseUsers = await BaseUser.find({
      _id: { $in: selectedStudentIds },
    }).select("name email");

    const shortlistedList = shortlistedBaseUsers.map((user) => {
      const studentIdStr = (user as any)._id.toString();

      const topScore = topScoresMap.get(studentIdStr);

      return {
        studentId: user._id,
        name: user.name || "Unknown",
        email: user.email || "Unknown",
        totalMarksScored: topScore ? topScore.totalMarksScored : null,
        submittedAt: topScore ? topScore.submittedAt : null,
        status: topScore ? "appeared" : "not-appeared",
      };
    });

    res.status(200).json({
      success: true,
      message: "Assessment results fetched successfully!",
      assessment,
      studentResponses, // all raw responses
      resultList, // top attempts by appeared students
      shortlistedList, // shortlisted students + marks if appeared
    });
  }
);
