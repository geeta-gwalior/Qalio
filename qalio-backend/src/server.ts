import express from "express";
import dotenv from "dotenv";
import { errorMiddleware } from "./utils/errorHandler"; // Import error handler
import cors from "cors";
// import { Server } from "socket.io";
import connectDB from "./config/db"; // Import DB Connection
import studentRoutes from "./routes/student/student.routes";
import collegeRoutes from "./routes/college/college.routes";
import companyRoutes from "./routes/company/company.routes";
import knowledgeRoutes from "./routes/company/knowledge.routes";
import universityRoutes from "./routes/university/university.routes";
import authRoutes from "./routes/auth/auth.routes"; // Import auth routes
import topicRoutes from "./routes/topic/topic.routes";
import jobRoutes from "./routes/job/job.routes";
import aiRoutes from "./routes/ai/ai.routes"; // Import AI routes
import chatRoutes from "./routes/chat/chat.routes";
import devRoutes from "./routes/dev.routes";

//import auth middleware
// import { authenticateJWT } from "./middlewares/auth/auth.middleware";

// question routes
import questionRoutes from "./routes/question/question.routes";

//assessment routes
import assessmentRoutes from "./routes/assessment/assessment.routes";
import userRoutes from "./routes/user.routes";

import studentAttemptRoutes from "./routes/assessment/studentAttempt.routes";
import { createServer } from "http";
import { initSocket } from "./socket";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

const server = createServer(app);
initSocket(server);
// Middleware
app.use(express.json({ limit: "2mb" })); // For parsing JSON request body
app.use(cors()); // Enable CORS

import path from 'path';
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// Register main routes
app.use("/api/student", studentRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/company/knowledge", knowledgeRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/auth", authRoutes); // Register auth routes

app.use("/api/topic", topicRoutes);

app.use("/api/jobs", jobRoutes);

app.use("/api/upload", userRoutes);

app.use("/api/chat", chatRoutes);

//Question routes
app.use("/api/question", questionRoutes);

app.use("/api/ai", aiRoutes);

import compilerRoutes from "./routes/compiler.routes";
app.use("/api/compiler", compilerRoutes);

//assessment routes
app.use("/api/assessments", assessmentRoutes);

//student attempt routes
app.use("/api/student-attempts", studentAttemptRoutes);

app.use("/api/dev", devRoutes);

app.use(errorMiddleware);
// Connect to Database
connectDB();

// Define a simple route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server with WebSocket running on port ${PORT}`);
});
