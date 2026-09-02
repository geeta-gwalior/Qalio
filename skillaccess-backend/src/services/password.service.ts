import bcrypt from "bcryptjs"
import { BaseUser } from "../models/user/baseUser.model"

interface PasswordValidationResult {
  isValid: boolean
  message: string
}

interface PasswordUpdateResult {
  success: boolean
  message: string
}

export class PasswordService {
  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): PasswordValidationResult {
    if (!password) {
      return {
        isValid: false,
        message: "Password is required",
      }
    }

    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      }
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      }
    }

    if (!/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one special character (!@#$%^&*)",
      }
    }

    return {
      isValid: true,
      message: "Password is strong",
    }
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * Compare plain password with hashed password
   */
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<PasswordUpdateResult> {
    try {
      // Find user with password field
      const user = await BaseUser.findById(userId).select("+password")

      if (!user) {
        return {
          success: false,
          message: "User not found",
        }
      }

      // Check if user has a password (OAuth users might not have one)
      if (!user.password) {
        return {
          success: false,
          message: "Cannot change password for OAuth users",
        }
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password)

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: "Current password is incorrect",
        }
      }

      // Check if new password is different from current
      const isSamePassword = await this.comparePassword(newPassword, user.password)

      if (isSamePassword) {
        return {
          success: false,
          message: "New password must be different from current password",
        }
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)

      // Update password in database
      await BaseUser.findByIdAndUpdate(
        userId,
        {
          password: hashedNewPassword,
          passwordChangedAt: new Date(),
        },
        { new: true },
      )

      return {
        success: true,
        message: "Password updated successfully",
      }
    } catch (error) {
      console.error("Password update error:", error)
      return {
        success: false,
        message: "Failed to update password. Please try again.",
      }
    }
  }

  /**
   * Generate a secure random password (utility function)
   */
  static generateSecurePassword(length = 12): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    const allChars = lowercase + uppercase + numbers + symbols
    let password = ""

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")
  }
}
