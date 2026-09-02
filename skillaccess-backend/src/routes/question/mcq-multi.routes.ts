import express from "express";
import {
  createMultiMCQ,
  getAllMultiMCQs,
  getMultiMCQById,
  updateMultiMCQ,
  deleteMultiMCQ,
} from "../../controllers/question/mcq-multi.controller";

const router = express.Router();

router.post("/", createMultiMCQ);
router.get("/", getAllMultiMCQs);
router.get("/:id", getMultiMCQById);
router.put("/:id", updateMultiMCQ);
router.delete("/:id", deleteMultiMCQ);

export default router;
