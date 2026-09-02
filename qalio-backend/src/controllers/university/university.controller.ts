// import { Request, Response } from "express";
// import { BaseUser } from "../../models/user/baseUser.model";
// import { University } from "../../models/university/university.model";

// interface RegisterUniversityRequest {
//   name: string;
//   email: string;
//   phone: string;
//   address?: string;
//   password: string;
// }

// export const registerUniversity = async (req: Request, res: Response): Promise<any> => {
//   try {

//     const {  name, email, phone, address, password  } = req.body as RegisterUniversityRequest;
//     // 🔹 Check if email already exists
//     const existingUser = await BaseUser.findOne({ email: email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User with this email already exists" });
//     }

//     // 🔹 Create a new user in BaseUser with role "university"
//     const baseUser = new BaseUser({
//       name: name,
//       email: email,
//       phone: phone,
//       address: address,
//       password: password, // Password will be hashed automatically
//       role: "university",
//       isApproved: false, // Universitys may require admin approval
//       verificationStatus: "pending",
//     });

//     await baseUser.save();

//     // 🔹 Create corresponding University record with only user reference
//     const university = new University({
//       userId: baseUser._id,
//     });

//     await university.save();

//     // 🔹 Send success response
//     res.status(201).json({
//       message: "University registered successfully",
//       user: {
//         _id: baseUser._id,
//         name: baseUser.name,
//         email: baseUser.email,
//         phone: baseUser.phone,
//         address: baseUser.address,
//         role: baseUser.role,
//         isApproved: baseUser.isApproved,
//         verificationStatus: baseUser.verificationStatus,
//       }
//     });
//   } catch (error) {
//     console.error("Error registering university:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


import { Request, Response } from "express";
import { registerUser } from "../../services/register.service";

export const registerUniversity = (req: Request, res: Response): Promise<any> => {
  // Assign role as "universi"
  req.body.role = "university";
  return registerUser(req, res);
};