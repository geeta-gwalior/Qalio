// import { Response } from "express";
// import { Student } from "../models/student/student.model";
// import { BaseUser } from "../models/user/baseUser.model";
// // import BlacklistToken from "../models/college/blacklistToken";

// // Define the login activity interface if not already defined
// interface LoginActivity {
//   ip: string;
//   logged_in_at: Date;
//   qrVerify: boolean;
//   device: string;
//   token_id: string;
//   token_deleted: boolean;
// }

// // interface ExtendedStudent extends BaseUser {
// //   getJWTToken: () => string;
// // //   loginActivity: LoginActivity[];
// // }

// const sendToken = async (

// // refer user to baseuser id of student

// //   user: BaseUser & { loginActivity: LoginActivity[] },
//   statusCode: number,
//   res: Response,
//   device?: string,
//   ip?: string
// ): Promise<void> => {
// //   const token = user.getJWTToken();

//   const options = {
//     expires: new Date(
//       Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     sameSite: "None" as const,
//   };

// //   res.cookie("token", token, options);

//   // Remove old token if exists
// //   await BlacklistToken.deleteOne({ token });

//   const existingLogin = user.loginActivity.find((activity) => activity.ip === ip);

//   if (existingLogin) {
//     existingLogin.qrVerify = false;
//     existingLogin.token_deleted = false;
//     existingLogin.device = device || "";
//     existingLogin.token_id = token;
//     existingLogin.logged_in_at = new Date();
//   } else {
//     user.loginActivity.push({
//       qrVerify: false,
//       ip: ip || "",
//       logged_in_at: new Date(),
//       device: device || "",
//       token_id: token,
//       token_deleted: false,
//     });
//   }

//   await Student.findByIdAndUpdate(user._id, {
//     loginActivity: user.loginActivity,
//   });

//   res.status(statusCode).json({
//     success: true,
//     user,
//     token,
//     ip,
//     device,
//   });
// };

// export default sendToken;
