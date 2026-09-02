import express from "express";
import upload from "../utils/multer";
import { uploadAvatar } from "../controllers/user/avatar.controller";

const router = express.Router();

router.post("/upload-avatar", upload.single("file"), uploadAvatar);

export default router;
