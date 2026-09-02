import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin"; // Adjust roles as needed
  };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      res.status(400).json({ message: "Bad Request: Invalid token format" });
      return;
    }

    const token = tokenParts[1];

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables");
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    console.log(decoded);

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId ||
      !decoded.role
    ) {
      res.status(403).json({ message: "Forbidden: Invalid token structure" });
      return;
    }

    // ✅ Attach user data to req.user
    req.user = {
      userId: decoded.userId,
      role: decoded.role as "college" | "company" | "university" | "admin",
    };

    next();
  } catch (error) {
    console.error("JWT Authentication Error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Unauthorized: Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Forbidden: Invalid token" });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
