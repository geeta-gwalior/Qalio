import express from "express";
import  {registerUniversity}  from "../../controllers/university/university.controller";

const router = express.Router();

router.post("/register", registerUniversity);

export default router;