import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  console.log("====== MOCKED COMPILER ======");
  console.log("Code received for language:", req.body.language);
  
  // Return a mock successful execution result
  res.status(200).json({
    stdout: "Mocked output: Hello World!\nExecution successful.",
    stderr: "",
    status: {
      id: 3,
      description: "Accepted"
    }
  });
});

export default router;
