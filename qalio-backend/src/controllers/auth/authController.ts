import { Request, Response } from "express";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BaseUser } from "../../models/user/baseUser.model";
import { LoginActivity } from "../../models/user/loginActivity.model";
import sendEmail from "../../utils/email/sendEmail";
import { generatePasswordResetEmail } from "../../utils/email/templates/resetPassword";

interface LoginRequest {
  email?: string;
  password?: string;
  googleAccessToken?: string;
}

// Function to fetch user details from Google
const getGoogleUser = async (token: string) => {
  try {
    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching Google user data:", error);
    return null;
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, googleAccessToken } = req.body as LoginRequest;
    let authType: "manual" | "google" = "manual"; // Default authentication type

    let user = null;

    // 🔹 Handle Google login
    if (googleAccessToken) {
      const googleUser = await getGoogleUser(googleAccessToken);
      if (!googleUser) {
        return res.status(400).json({ message: "Invalid Google access token" });
      }

      // 🔹 Find or create user by Google email
      user = await BaseUser.findOne({ email: googleUser.email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "No account found with this Google email" });
      }

      authType = "google";
    }

    // 🔹 Handle Manual Login (Email & Password)
    if (email && password) {
      //   user = await BaseUser.findOne({ email });
      user = await BaseUser.findOne({ email }).select("+password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      //   const isPasswordValid = await bcrypt.compare(password, user.password);
      const isPasswordValid = await user.comparePassword(password);
      console.log("isPasswordValid", isPasswordValid);

      if (!isPasswordValid) {
        await LoginActivity.create({
          userId: user._id,
          activityType: "failed-login",
          authType,
          ipAddress: req.ip || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
        });

        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid login attempt" });
    }

    // 🔹 Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, // Include role
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 🔹 Log successful login
    await LoginActivity.create({
      userId: user._id,
      activityType: "login",
      authType,
      ipAddress: req.ip || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
    });

    // 🔹 Send success response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, //Include role to differentiate users
        authType,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res
      .status(400)
      .json({ message: "Please provide a token", validity: false });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // ✅ verify & decode

    // Optional: fetch user from DB
    const user = await BaseUser.findById(decoded.userId).select("-password");

    res.status(200).json({
      message: "Token is valid",
      validity: true,
      user,
      decoded,
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token has expired", validity: false });
    } else {
      res.status(400).json({ message: "Invalid token", validity: false });
    }
  }
};

//forget password functionality
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmailUtil(emailPayload: EmailPayload): Promise<boolean> {
  try {
    const result = await sendEmail({
      email: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
    });

    return result.success;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await BaseUser.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: "password-reset",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // Generate and send email
    const emailPayload = generatePasswordResetEmail({
      email: user.email,
      firstName: user.name.split(" ")[0] || "User",
      resetToken,
    });

    const emailSent = await sendEmailUtil(emailPayload);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyResetToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    // Verify the token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Check if it's a password reset token
    if (decoded.type !== "password-reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Check if user still exists
    const user = await BaseUser.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      email: decoded.email,
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one.",
      });
    }

    console.error("Token verification error:", error);
    res.status(400).json({
      success: false,
      message: "Invalid reset token",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Verify the token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Check if it's a password reset token
    if (decoded.type !== "password-reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Find the user
    const user = await BaseUser.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    await BaseUser.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one.",
      });
    }

    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
};
