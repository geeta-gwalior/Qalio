import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { BaseUser } from "../models/user/baseUser.model";
import { College } from "../models/college/college.model";
import { Company } from "../models/company/company.model";
import { Student } from "../models/student/student.model";
import { University } from "../models/university/university.model";
import { LoginActivity } from "../models/user/loginActivity.model";

interface RegisterUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  role?: "university" | "student" | "college" | "company" | "others";
  googleAccessToken?: string;
  batch?: string; // For students
  major?: string; // For students
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
  } catch (error: any) {
    console.error("Error fetching Google user data:", error.message);
    return null;
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      password,
      role,
      googleAccessToken,
      batch,
      major,
    } = req.body as RegisterUserRequest;

    let userData = { name, email, phone, address, password, role };
    let authType: "manual" | "google" = "manual"; // Default to manual registration

    // 🔹 If Google login, fetch user details
    if (googleAccessToken) {
      const googleUser = await getGoogleUser(googleAccessToken);
      if (!googleUser) {
        return res.status(400).json({ message: "Invalid Google access token" });
      }

      userData = {
        name: googleUser.name,
        email: googleUser.email,
        phone: "", // Google API does not return phone
        address: "",
        password: "", // No password required for Google login
        role: role || "others",
      };

      authType = "google";
    }

    // 🔹 Check if email already exists
    let existingUser = await BaseUser.findOne({ email: userData.email });

    if (existingUser) {
      // If the user exists and logged in via Google, return success
      if (googleAccessToken) {
        await LoginActivity.create({
          userId: existingUser._id,
          activityType: "google-login",
          authType,
          ipAddress: req.ip || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
        });

        return res.status(200).json({
          message: "Google login successful",
          user: {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            authType,
          },
        });
      }

      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // 🔹 Create a new BaseUser
    const baseUser = new BaseUser({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      password: userData.password, // Will be empty if Google login
      role: userData.role,
      isApproved: googleAccessToken ? true : false, // Auto-approve Google users
      verificationStatus: googleAccessToken ? "approved" : "pending",
      authType, // 🔹 Add authType field
    });

    await baseUser.save();

    // 🔹 Create a login activity record
    await LoginActivity.create({
      userId: baseUser._id,
      activityType: googleAccessToken ? "google-register" : "register",
      authType,
      ipAddress: req.ip || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
    });

    // 🔹 Create specific entity based on role
    switch (userData.role) {
      case "college":
        await new College({ userId: baseUser._id }).save();
        break;
      case "company":
        await new Company({ userId: baseUser._id }).save();
        break;
      case "student":
        await new Student({
          userId: baseUser._id,
          batch: batch,
          major: major,
        }).save();
        break;
      case "university":
        await new University({ userId: baseUser._id }).save();
        break;
    }

    const token = jwt.sign(
      { userId: baseUser._id, email: baseUser.email, role: baseUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 🔹 Send success response
    res.status(201).json({
      message: googleAccessToken
        ? "Google user registered successfully"
        : `registered successfully`,
      token,
      user: {
        _id: baseUser._id,
        name: baseUser.name,
        email: baseUser.email,
        role: baseUser.role,
        isApproved: baseUser.isApproved,
        verificationStatus: baseUser.verificationStatus,
        authType,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
