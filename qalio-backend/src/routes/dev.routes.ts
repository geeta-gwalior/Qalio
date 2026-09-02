import { testPromptEvaluation } from "../controllers/dev.controller";
import express, { Request, Response } from "express";

const router = express.Router();

router.post("/evaluate-prompt", testPromptEvaluation);

export default router;
