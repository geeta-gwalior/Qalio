import StudentResultPage from "@/app/(authenticated)/college/result/student-result/[id]/page";
import React from "react";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  return <StudentResultPage params={params} />;
};

export default Page;
