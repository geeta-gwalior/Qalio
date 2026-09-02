import express from "express";
import {
  createMCQ,
  getAllMCQs,
  getMCQById,
  updateMCQ,
  deleteMCQ,
} from "../../controllers/question/mcq.controller";

const router = express.Router();

router.post("/", createMCQ);
router.get("/", getAllMCQs);
router.get("/:id", getMCQById);
router.put("/:id", updateMCQ);
router.delete("/:id", deleteMCQ);

export default router;
