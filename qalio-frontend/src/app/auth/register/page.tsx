import { Suspense } from "react";
import InvitedStudentRegistration from "./InvitedStudentRegistration";

export default function RegisterPage() {
  return (
    <Suspense>
      <InvitedStudentRegistration />
    </Suspense>
  );
}
