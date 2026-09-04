// controllers/assessment/studentAttempt.controller.ts

import { Request, Response, NextFunction } from "express";
import StudentResponse from "../../models/assessment/studentResponse.model";
import Assessments from "../../models/assessment/assessment.model";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";

import Question from "../../models/assessment/question.model";
import MCQ from "../../models/assessment/mcq.model";
import FindAnswer from "../../models/assessment/findAnswer.model";
import Coding from "../../models/assessment/coding.model";
import MCQMulti from "../../models/assessment/multi-mcq.model";
import CompilerLog from "../../models/compilerLog";
import cloudinary from "../../config/cloudinary";
import StudentScreenshots from "../../models/student/studentScreenshots.model";
import Prompt from "../../models/assessment/prompt.model";
import { evaluatePromptAnswer } from "../../utils/gptPromptEvaluator";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}

// export const startAssessmentAttempt = catchAsyncErrors(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const studentId = req.user?.userId;
//     const { assessmentId } = req.body;

//     const assessment = await Assessments.findById(assessmentId);
//     if (
//       !assessment ||
//       !studentId ||
//       !assessment.invitedStudents.some((id: any) => id.toString() === studentId)
//     ) {
//       return next(
//         new ErrorHandler("Assessment not found or access denied", 403)
//       );
//     }

//     const existing = await StudentResponse.findOne({
//       assessment: assessmentId,
//       student: studentId,
//     });

//     if (existing) {
//       res.status(200).json({
//         success: true,
//         message: "Already started",
//         response: existing,
//       });
//       return;
//     }

//     const newAttempt = await StudentResponse.create({
//       assessment: assessmentId,
//       student: studentId,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Assessment attempt started",
//       response: newAttempt,
//     });
//   }
// );

// export const startAssessmentAttempt = catchAsyncErrors(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const studentId = req.user?.userId!;
//     const { assessmentId } = req.body;

//     // 1️⃣ Fetch assessment & verify invitation
//     const assessment = await Assessments.findById(assessmentId);
//     if (
//       !assessment ||
//       !assessment.invitedStudents.some((id) => id.toString() === studentId)
//     ) {
//       return next(
//         new ErrorHandler("Assessment not found or access denied", 403)
//       );
//     }

//     // 2️⃣ Count prior attempts
//     const attemptCount = await StudentResponse.countDocuments({
//       assessment: assessmentId,
//       student: studentId,
//     });

//     // 3️⃣ Enforce limit
//     if (
//       typeof assessment.totalAttempts === "number" &&
//       attemptCount >= assessment.totalAttempts
//     ) {
//       return next(
//         new ErrorHandler(
//           `Attempt limit reached (${assessment.totalAttempts} attempts allowed)`,
//           403
//         )
//       );
//     }

//     // 4️⃣ If there's an in-progress attempt, return it
//     const inProgress = await StudentResponse.findOne({
//       assessment: assessmentId,
//       student: studentId,
//       status: "in-progress",
//     });
//     if (inProgress) {
//       res.status(200).json({
//         success: true,
//         message: "Resuming existing attempt",
//         response: inProgress,
//       });
//       return;
//     }

//     // 5️⃣ Otherwise, create a new attempt
//     const newAttempt = await StudentResponse.create({
//       assessment: assessmentId,
//       student: studentId,
//     });

//     res.status(201).json({
//       success: true,
//       message: "New assessment attempt started",
//       response: newAttempt,
//     });
//   }
// );

export const startAssessmentAttempt = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const studentId = req.user?.userId!;
    const { assessmentId } = req.body;

    // 1️⃣ Validate assessment & student invitation
    const assessment = await Assessments.findById(assessmentId);
    if (
      !assessment ||
      !assessment.invitedStudents.some((id) => id.toString() === studentId)
    ) {
      return next(
        new ErrorHandler("Assessment not found or access denied", 403)
      );
    }

    // 2️⃣ Count submitted attempts only (not in-progress)
    const submittedAttempts = await StudentResponse.countDocuments({
      assessment: assessmentId,
      student: studentId,
      status: "submitted",
    });

    // 3️⃣ Enforce attempt limit
    if (
      typeof assessment.totalAttempts === "number" &&
      submittedAttempts >= assessment.totalAttempts
    ) {
      return next(
        new ErrorHandler(
          `Attempt limit reached (${assessment.totalAttempts} allowed)`,
          403
        )
      );
    }

    // 4️⃣ (Optional) Clean up any abandoned in-progress attempts
    await StudentResponse.deleteMany({
      assessment: assessmentId,
      student: studentId,
      status: "in-progress",
    });

    // 5️⃣ Create a brand new attempt
    const newAttempt = await StudentResponse.create({
      assessment: assessmentId,
      student: studentId,
    });

    res.status(201).json({
      success: true,
      message: "New fresh assessment attempt started",
      response: newAttempt,
    });
  }
);

export const submitAssessmentAttempt = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const studentId = req.user?.userId;
    const { responseId, responses } = req.body;

    const studentResponse = await StudentResponse.findOne({
      _id: responseId,
      student: studentId,
    });

    if (!studentResponse || studentResponse.status === "submitted") {
      return next(
        new ErrorHandler("Invalid attempt or already submitted", 400)
      );
    }

    const assessment = await Assessments.findById(studentResponse.assessment);
    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    // ✅ If manual result policy → skip evaluation
    if (assessment.config.resultPolicy === "manual") {
      console.log("Manual result policy, skipping evaluation");
      studentResponse.responses = responses;
      studentResponse.status = "submitted";
      studentResponse.submittedAt = new Date();

      await studentResponse.save();

      await Assessments.findByIdAndUpdate(studentResponse.assessment, {
        $addToSet: {
          studentResponses: studentResponse._id,
          appearedStudents: studentId,
        },
      });

      res.status(200).json({
        success: true,
        message:
          "Assessment submitted successfully. Results will be published later.",
      });
      return;
    }

    // ✅ Else (AUTO policy) → do evaluation
    let totalMarks = 0;
    const evaluatedResponses = [];

    for (const resp of responses) {
      const baseQuestion = await Question.findById(resp.questionId);
      if (!baseQuestion) continue;

      let isCorrect = false;
      let marksAwarded = 0;

      switch (baseQuestion.questionType) {
        case "mcq": {
          const mcq = await MCQ.findById(resp.questionId);
          const correct = mcq?.options.find((opt) => opt.isCorrect)?.text;
          isCorrect = correct === resp.answer;
          marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
          break;
        }

        case "mcqmulti": {
          const mcqMulti = await MCQMulti.findById(resp.questionId);
          const correctAnswers = mcqMulti?.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.text)
            .sort();
          const userAnswers = [...resp.answer].sort();
          isCorrect =
            JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
          marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
          break;
        }

        case "findAnswer": {
          const fa = await FindAnswer.findById(resp.questionId);
          if (!fa) break;

          let localScore = 0;
          const totalLocal = fa.questions.length;

          for (let i = 0; i < fa.questions.length; i++) {
            const q = fa.questions[i];
            const correct = q.options.find((o) => o.isCorrect)?.text?.trim();
            const studentAns =
              typeof resp.answer[i] === "string" ? resp.answer[i].trim() : null;

            if (studentAns && correct && studentAns === correct) {
              localScore++;
            }
          }

          isCorrect = localScore === totalLocal;
          marksAwarded = (localScore / totalLocal) * baseQuestion.totalMarks;
          break;
        }

        case "coding": {
          const coding = await Coding.findById(resp.questionId);
          if (!coding) break;

          const log = await CompilerLog.findOne({
            student: studentId,
            assessment: studentResponse.assessment,
            question: resp.questionId,
          }).sort({ createdAt: -1 });

          if (!log) break;

          const passed = log.totalPassedTestCases;
          const total = log.totalTestCases;

          const scoreRatio = passed / total;
          marksAwarded = parseFloat(
            (scoreRatio * baseQuestion.totalMarks).toFixed(2)
          );
          isCorrect = passed === total;

          resp.answer = log.testcase;
          break;
        }

        default:
          break;
      }

      totalMarks += marksAwarded;

      evaluatedResponses.push({
        questionId: resp.questionId,
        answer: resp.answer,
        isCorrect,
        marksAwarded,
      });
    }

    studentResponse.responses = evaluatedResponses;
    studentResponse.totalMarksScored = totalMarks;
    studentResponse.status = "submitted";
    studentResponse.submittedAt = new Date();

    await studentResponse.save();

    await Assessments.findByIdAndUpdate(studentResponse.assessment, {
      $addToSet: {
        studentResponses: studentResponse._id,
        appearedStudents: studentId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Assessment submitted and evaluated successfully",
      result: studentResponse,
    });
  }
);

export const takeAndSaveScreenshot = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { studentId, assessmentId, studentResponseId } = req.body;

    console.log(req.file);

    if (!req.file) {
      return next(new ErrorHandler("No screenshot file uploaded", 400));
    }

    const file = req.file;

    console.log(file);

    // Convert buffer to base64 and create data URI
    const base64String = file.buffer.toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "screenshots",
      transformation: [
        { width: 1280, height: 720, crop: "limit" },
        { quality: "auto" },
      ],
    });

    // Construct new screenshot object
    const newScreenshot = {
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      date: new Date(),
    };

    // Insert or update the screenshot document
    let screenshotDoc = await StudentScreenshots.findOne({
      studentId,
      assessmentId,
      studentResponseId,
    });

    if (!screenshotDoc) {
      screenshotDoc = await StudentScreenshots.create({
        studentId,
        assessmentId,
        studentResponseId,
        screenshots: [newScreenshot],
      });
    } else {
      screenshotDoc.screenshots.push(newScreenshot);
      await screenshotDoc.save();
    }

    res.status(200).json({
      success: true,
      message: "Screenshot uploaded and saved successfully",
      data: screenshotDoc,
    });
  }
);

// export const evaluateManualAssessmentResults = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { assessmentId } = req.params;

//     const assessment = await Assessments.findById(assessmentId);
//     if (!assessment || assessment.config.resultPolicy !== "manual") {
//       return next(new ErrorHandler("Invalid assessment or result policy", 400));
//     }

//     const responses = await StudentResponse.find({
//       assessment: assessmentId,
//       status: "submitted",
//       totalMarksScored: 0,
//     });

//     for (const studentResponse of responses) {
//       let totalMarks = 0;
//       const evaluatedResponses = [];

//       for (const resp of studentResponse.responses) {
//         const baseQuestion = await Question.findById(resp.questionId);
//         if (!baseQuestion) continue;

//         let isCorrect = false;
//         let marksAwarded = 0;

//         switch (baseQuestion.questionType) {
//           case "mcq": {
//             const mcq = await MCQ.findById(resp.questionId);
//             const correct = mcq?.options.find((opt) => opt.isCorrect)?.text;
//             isCorrect = correct === resp.answer;
//             marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
//             break;
//           }

//           case "mcqmulti": {
//             const mcqMulti = await MCQMulti.findById(resp.questionId);
//             const correctAnswers = mcqMulti?.options
//               .filter((opt) => opt.isCorrect)
//               .map((opt) => opt.text)
//               .sort();
//             const userAnswers = [...resp.answer].sort();
//             isCorrect =
//               JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
//             marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
//             break;
//           }

//           case "findAnswer": {
//             const fa = await FindAnswer.findById(resp.questionId);
//             if (!fa) break;

//             let localScore = 0;
//             const totalLocal = fa.questions.length;

//             for (let i = 0; i < fa.questions.length; i++) {
//               const q = fa.questions[i];
//               const correct = q.options.find((o) => o.isCorrect)?.text?.trim();
//               const studentAns =
//                 typeof resp.answer[i] === "string"
//                   ? resp.answer[i].trim()
//                   : null;

//               if (studentAns && correct && studentAns === correct) {
//                 localScore++;
//               }
//             }

//             isCorrect = localScore === totalLocal;
//             marksAwarded = (localScore / totalLocal) * baseQuestion.totalMarks;
//             break;
//           }

//           case "coding": {
//             const coding = await Coding.findById(resp.questionId);
//             if (!coding) break;

//             const log = await CompilerLog.findOne({
//               student: studentResponse.student,
//               assessment: assessmentId,
//               question: resp.questionId,
//             }).sort({ createdAt: -1 });

//             if (!log) break;

//             const passed = log.totalPassedTestCases;
//             const total = log.totalTestCases;

//             const scoreRatio = passed / total;
//             marksAwarded = parseFloat(
//               (scoreRatio * baseQuestion.totalMarks).toFixed(2)
//             );
//             isCorrect = passed === total;

//             resp.answer = log.testcase;
//             break;
//           }

//           case "prompt": {
//             const promptQ = await Prompt.findById(resp.questionId);
//             if (!promptQ) break;

//             const gptScore = await evaluatePromptAnswer({
//               question: baseQuestion.title,
//               expectedOutputDescription: promptQ.expectedOutputDescription,
//               studentAnswer: resp.answer,
//             });

//             const scoreRatio = gptScore / 100;
//             marksAwarded = parseFloat(
//               (scoreRatio * baseQuestion.totalMarks).toFixed(2)
//             );

//             isCorrect = gptScore >= 100;

//             evaluatedResponses.push({
//               questionId: resp.questionId,
//               answer: resp.answer,
//               isCorrect,
//               marksAwarded,
//               gptScore,
//             });

//             totalMarks += marksAwarded;
//             continue; // skip default push (already added above)
//           }

//           // case "prompt": {
//           //   const promptQ = await Prompt.findById(resp.questionId);
//           //   if (!promptQ) break;

//           //   const gptScore = await evaluatePromptAnswer({
//           //     question: promptQ.question,
//           //     expectedOutputDescription: promptQ.expectedOutputDescription,
//           //     studentAnswer: resp.answer,
//           //   });

//           //   // ✅ Use inherited totalMarks from baseQuestion
//           //   const scoreRatio = gptScore / 100;
//           //   marksAwarded = parseFloat(
//           //     (scoreRatio * baseQuestion.totalMarks).toFixed(2)
//           //   );

//           //   isCorrect = gptScore >= 100;

//           //   evaluatedResponses.push({
//           //     questionId: resp.questionId,
//           //     answer: resp.answer,
//           //     isCorrect,
//           //     marksAwarded,
//           //     gptScore,
//           //   });

//           //   break;
//           // }

//           default:
//             break;
//         }

//         totalMarks += marksAwarded;

//         evaluatedResponses.push({
//           questionId: resp.questionId,
//           answer: resp.answer,
//           isCorrect,
//           marksAwarded,
//         });
//       }

//       studentResponse.responses = evaluatedResponses;
//       studentResponse.totalMarksScored = totalMarks;
//       await studentResponse.save();
//     }

//     assessment.isReportGenerated = true;
//     assessment.resultPublishedAt = new Date();
//     await assessment.save();

//     res.status(200).json({
//       success: true,
//       message: `Evaluated ${responses.length} student submissions`,
//     });
//   }
// );

export const evaluateManualAssessmentResults = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { assessmentId } = req.params;

    const assessment = await Assessments.findById(assessmentId);
    if (!assessment || assessment.config.resultPolicy !== "manual") {
      return next(new ErrorHandler("Invalid assessment or result policy", 400));
    }

    // Set manualResultPublishStatus to "in-progress"
    assessment.manualResultPublishStatus = "in-progress";
    await assessment.save();

    const responses = await StudentResponse.find({
      assessment: assessmentId,
      status: "submitted",
      totalMarksScored: 0,
    });

    for (const studentResponse of responses) {
      let totalMarks = 0;
      const evaluatedResponses: any[] = [];

      for (const resp of studentResponse.responses) {
        const baseQuestion = await Question.findById(resp.questionId);
        if (!baseQuestion) continue;

        let isCorrect = false;
        let marksAwarded = 0;

        switch (baseQuestion.questionType) {
          case "mcq": {
            const mcq = await MCQ.findById(resp.questionId);
            const correct = mcq?.options.find((opt) => opt.isCorrect)?.text;
            isCorrect = correct === resp.answer;
            marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
            break;
          }

          case "mcqmulti": {
            const mcqMulti = await MCQMulti.findById(resp.questionId);
            const correctAnswers = mcqMulti?.options
              .filter((opt) => opt.isCorrect)
              .map((opt) => opt.text)
              .sort();
            const userAnswers = [...resp.answer].sort();
            isCorrect =
              JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
            marksAwarded = isCorrect ? baseQuestion.totalMarks : 0;
            break;
          }

          case "findAnswer": {
            const fa = await FindAnswer.findById(resp.questionId);
            if (!fa) break;

            let localScore = 0;
            const totalLocal = fa.questions.length;

            for (let i = 0; i < fa.questions.length; i++) {
              const q = fa.questions[i];
              const correct = q.options.find((o) => o.isCorrect)?.text?.trim();
              const studentAns =
                typeof resp.answer[i] === "string"
                  ? resp.answer[i].trim()
                  : null;

              if (studentAns && correct && studentAns === correct) {
                localScore++;
              }
            }

            isCorrect = localScore === totalLocal;
            marksAwarded = (localScore / totalLocal) * baseQuestion.totalMarks;
            break;
          }

          case "coding": {
            const coding = await Coding.findById(resp.questionId);
            if (!coding) break;

            const log = await CompilerLog.findOne({
              student: studentResponse.student,
              assessment: assessmentId,
              question: resp.questionId,
            }).sort({ createdAt: -1 });

            if (!log) break;

            const passed = log.totalPassedTestCases;
            const total = log.totalTestCases;

            const scoreRatio = passed / total;
            marksAwarded = parseFloat(
              (scoreRatio * baseQuestion.totalMarks).toFixed(2)
            );
            isCorrect = passed === total;

            resp.answer = log.testcase;
            break;
          }

          case "prompt": {
            const promptQ = await Prompt.findById(resp.questionId);
            if (!promptQ) break;

            const gptScore = await evaluatePromptAnswer({
              question: baseQuestion.title,
              expectedOutputDescription: promptQ.expectedOutputDescription,
              studentAnswer: resp.answer,
            });

            const scoreRatio = gptScore / 100;
            marksAwarded = parseFloat(
              (scoreRatio * baseQuestion.totalMarks).toFixed(2)
            );

            isCorrect = gptScore >= 100;

            evaluatedResponses.push({
              questionId: resp.questionId,
              answer: resp.answer,
              isCorrect,
              marksAwarded,
              gptScore,
            });

            totalMarks += marksAwarded;
            continue; // skip default push (already added above)
          }

          default:
            break;
        }

        totalMarks += marksAwarded;

        evaluatedResponses.push({
          questionId: resp.questionId,
          answer: resp.answer,
          isCorrect,
          marksAwarded,
        });
      }

      studentResponse.responses = evaluatedResponses;
      studentResponse.totalMarksScored = totalMarks;
      studentResponse.evaluatedStatus = "evaluated";
      await studentResponse.save();
    }

    // Update final status on assessment
    assessment.isReportGenerated = true;
    assessment.resultPublishedAt = new Date();
    assessment.manualResultPublishStatus = "published";
    await assessment.save();

    res.status(200).json({
      success: true,
      message: `Evaluated ${responses.length} student submissions`,
    });
  }
);

// Log Proctoring Anti-Cheat Event
export const logProctoringEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { responseId, assessmentId, studentId, event, details } = req.body;

    let responseRecord;
    if (responseId) {
      responseRecord = await StudentResponse.findById(responseId);
    } else if (assessmentId && studentId) {
      responseRecord = await StudentResponse.findOne({
        assessment: assessmentId,
        student: studentId,
      });
    }

    if (!responseRecord) {
      res.status(200).json({ success: true, message: "Response record not found yet" });
      return;
    }

    if (!responseRecord.proctoringLogs) {
      responseRecord.proctoringLogs = [];
    }

    responseRecord.proctoringLogs.push({
      event: event || "UNKNOWN_EVENT",
      timestamp: new Date(),
      details: details || "",
    });

    if (event === "TAB_SWITCH" || event === "WINDOW_BLUR") {
      responseRecord.tabSwitchCount = (responseRecord.tabSwitchCount || 0) + 1;
    }

    const switchPenalties = (responseRecord.tabSwitchCount || 0) * 10;
    responseRecord.trustScore = Math.max(0, 100 - switchPenalties);

    await responseRecord.save();

    res.status(200).json({
      success: true,
      tabSwitchCount: responseRecord.tabSwitchCount,
      trustScore: responseRecord.trustScore,
      proctoringLogs: responseRecord.proctoringLogs,
    });
  }
);
