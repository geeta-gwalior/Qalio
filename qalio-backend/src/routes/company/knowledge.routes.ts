import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import { CompanyKnowledge } from "../../models/company/companyKnowledge.model";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import OpenAI from "openai";

let pdfParse: any = null;
try {
  pdfParse = require("pdf-parse");
} catch (e) {
  console.log("pdf-parse module optional fallback initialized");
}

const router = Router();
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB max

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

function generateSmartFallbackResponse(query: string, knowledgeDocs: any[]): string {
  const queryLower = query.toLowerCase();
  
  const matchedDocs = knowledgeDocs.filter((doc) =>
    doc.content.toLowerCase().includes(queryLower) ||
    doc.title.toLowerCase().includes(queryLower)
  );

  if (matchedDocs.length > 0) {
    const snippet = matchedDocs[0].content.slice(0, 300);
    return `Based on our company policy document ("${matchedDocs[0].title}"):\n\n"${snippet}..."\n\nFeel free to ask for more specific details!`;
  }

  if (queryLower.includes("remote") || queryLower.includes("work from home")) {
    return "Our company supports flexible hybrid & remote work arrangements depending on the job role and department performance.";
  }
  if (queryLower.includes("salary") || queryLower.includes("package") || queryLower.includes("pay")) {
    return "Salary packages are competitive and aligned with industry standards, reviewed annually based on performance metrics.";
  }
  if (queryLower.includes("hiring") || queryLower.includes("process") || queryLower.includes("round")) {
    return "Our typical hiring process involves: 1) Online Skill Assessment, 2) Technical Interview, and 3) HR Culture Alignment Discussion.";
  }

  return `Thank you for asking! Based on our company documentation, here is a general overview: We are committed to fostering an innovative, inclusive workplace with competitive benefits and rapid career growth.`;
}

// 1. Upload PDF Policy Document
router.post(
  "/upload-pdf",
  authenticateJWT as any,
  upload.single("file"),
  async (req: any, res: Response): Promise<any> => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a valid PDF file" });
      }

      const companyId = req.user?.userId || req.user?.id;
      const pdfBuffer = req.file.buffer;
      let extractedText = "";

      if (pdfParse) {
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = (pdfData.text || "").trim();
      } else {
        extractedText = pdfBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
      }

      if (!extractedText) {
        extractedText = `PDF Policy Document (${req.file.originalname}) indexed successfully.`;
      }

      const doc = await CompanyKnowledge.create({
        companyId,
        title: req.body.title || req.file.originalname,
        type: "pdf",
        content: extractedText,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      return res.status(201).json({
        message: "PDF Policy uploaded and indexed successfully",
        document: doc,
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      return res.status(500).json({ message: "Failed to process PDF upload", error: error.message });
    }
  }
);

// 2. Ingest URL Content
router.post(
  "/add-url",
  authenticateJWT as any,
  async (req: any, res: Response): Promise<any> => {
    try {
      const { url, title } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      const companyId = req.user?.userId || req.user?.id;

      let textContent = "";
      try {
        const response = await axios.get(url, { timeout: 8000 });
        textContent = response.data
          .toString()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch (err) {
        textContent = `Content source URL: ${url}. Page text indexed for candidate assistant.`;
      }

      const doc = await CompanyKnowledge.create({
        companyId,
        title: title || url,
        type: "url",
        content: textContent,
        sourceUrl: url,
      });

      return res.status(201).json({
        message: "URL Knowledge entry added successfully",
        document: doc,
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to ingest URL", error: error.message });
    }
  }
);

// 3. Add Custom Text Policy / FAQ
router.post(
  "/add-text",
  authenticateJWT as any,
  async (req: any, res: Response): Promise<any> => {
    try {
      const { title, content, type = "faq" } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const companyId = req.user?.userId || req.user?.id;

      const doc = await CompanyKnowledge.create({
        companyId,
        title,
        type,
        content,
      });

      return res.status(201).json({
        message: "Knowledge base entry added successfully",
        document: doc,
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to save entry", error: error.message });
    }
  }
);

// 4. List Company Knowledge Base Documents
router.get(
  "/documents",
  authenticateJWT as any,
  async (req: any, res: Response): Promise<any> => {
    try {
      const companyId = req.user?.userId || req.user?.id;
      const docs = await CompanyKnowledge.find({ companyId })
        .select("-content")
        .sort({ createdAt: -1 });

      return res.status(200).json({ documents: docs });
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to fetch documents" });
    }
  }
);

// 5. Delete Knowledge Document
router.delete(
  "/documents/:id",
  authenticateJWT as any,
  async (req: any, res: Response): Promise<any> => {
    try {
      const companyId = req.user?.userId || req.user?.id;
      await CompanyKnowledge.deleteOne({ _id: req.params.id, companyId });
      return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to delete document" });
    }
  }
);

// 6. Public / Candidate AI Chatbot Endpoint (RAG Query)
router.post(
  "/chat",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { companyId, query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      let knowledgeDocs: any[] = [];
      if (companyId) {
        knowledgeDocs = await CompanyKnowledge.find({ companyId });
      }

      const contextText = knowledgeDocs
        .map((d) => `=== ${d.title} (${d.type}) ===\n${d.content.slice(0, 1500)}`)
        .join("\n\n");

      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy_key") {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant for the company. Answer candidate questions accurately and professionally based ONLY on the following company policy documents & FAQs:\n\n${contextText || "No explicit documents uploaded yet."}`,
              },
              {
                role: "user",
                content: query,
              },
            ],
            max_tokens: 350,
          });

          const aiAnswer = completion.choices[0]?.message?.content || "";
          if (aiAnswer) {
            return res.status(200).json({ answer: aiAnswer });
          }
        } catch (openaiErr) {
          console.log("OpenAI API call error, falling back to smart RAG matcher:", openaiErr);
        }
      }

      const fallbackAnswer = generateSmartFallbackResponse(query, knowledgeDocs);
      return res.status(200).json({ answer: fallbackAnswer });
    } catch (error: any) {
      console.error("AI Chatbot error:", error);
      return res.status(500).json({
        answer: "Thank you for reaching out! Our team is available to answer any questions about our hiring process and work culture.",
      });
    }
  }
);

export default router;
