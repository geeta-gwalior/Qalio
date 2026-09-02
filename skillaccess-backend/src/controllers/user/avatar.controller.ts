import { Request, Response, NextFunction } from "express";
import cloudinary from "../../config/cloudinary"; // Assuming cloudinary config

// Type the return type to Promise<void>
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return; // Just exit after sending the response
    }

    const file = req.file;

    // Convert buffer to base64
    const base64String = file.buffer.toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "student_avatars",
      transformation: [
        { width: 250, height: 250, crop: "fill" },
        { quality: "auto" },
      ],
    });

    // Send response without returning anything
    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    // Catch and handle errors
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};
