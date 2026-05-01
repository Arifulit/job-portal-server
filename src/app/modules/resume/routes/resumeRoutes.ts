
// routes/resume/resumeRoutes.ts
import { Router, raw } from "express";
import { resumeUpload } from "../../../middleware/upload";
import fs from "fs";
// import { analyzeResumeWithGemini } from "../../../integrations/gemini/resumeParser";
import resumeGenerateRoutes from "./resumeGenerateRoutes";
import { analyzeResumeWithGemini } from "../../../integrations/openai/resumeParser";

const router = Router();

const getQueryValue = (value: any): string | undefined => {
  if (Array.isArray(value)) return value[0] as string;
  if (typeof value === 'string') return value;
  return undefined;
};

const getBodyValue = (value: any): string | undefined => {
  if (Array.isArray(value)) return value[0] as string;
  if (typeof value === "string") return value.trim();
  return undefined;
};

const runAnalysis = async (input: { filePath?: string; text?: string; fileBuffer?: Buffer; mimetype?: string }) => {
  if (input.filePath) {
    return analyzeResumeWithGemini(input.filePath);
  }

  if (input.fileBuffer && input.fileBuffer.length > 0) {
    return analyzeResumeWithGemini(undefined, input.fileBuffer, input.mimetype || "application/pdf");
  }

  if (input.text) {
    return analyzeResumeWithGemini(undefined, Buffer.from(input.text, "utf-8"), input.mimetype || "text/plain");
  }

  throw new Error("Provide either a file upload, filePath query, or text query.");
};

// GET /resume/analyze?text=... or ?filePath=...
router.get("/analyze", async (req, res) => {
  try {
    const filePath = getQueryValue(req.query.filePath);
    const text = getQueryValue(req.query.text);
    const mimetype = getQueryValue(req.query.mimetype);

    if (!filePath && !text) {
      return res.status(400).json({
        success: false,
        message: "Use GET with ?text=... or ?filePath=..., or POST a resume file.",
      });
    }

    const aiResult = await runAnalysis({ filePath, text, mimetype });

    return res.json({
      success: true,
      ...aiResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /resume/analyze
router.post(
  "/analyze",
  raw({ type: ["application/pdf", "application/octet-stream"], limit: "5mb" }),
  resumeUpload.single("resume"),
  async (req, res) => {
  try {
    const bodyText = getBodyValue((req.body as any)?.text) || getBodyValue((req.body as any)?.resumeText);
    const rawBody = Buffer.isBuffer(req.body) ? req.body : undefined;

    if (!req.file && !bodyText && !rawBody) {
      return res.status(400).json({
        success: false,
        message: "Upload a PDF file, send raw PDF bytes, or send plain resume text in 'text' or 'resumeText'.",
      });
    }

    const aiResult = req.file
      ? await runAnalysis({ filePath: req.file.path })
      : rawBody
        ? await runAnalysis({ fileBuffer: rawBody, mimetype: "application/pdf" })
        : await runAnalysis({ text: bodyText, mimetype: "text/plain" });

    // Remove local file after processing
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    return res.json({
      success: true,
      ...aiResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Resume analysis failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
  },
);

// Mount resume generate route
router.use(resumeGenerateRoutes);

export default router;