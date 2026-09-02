import AssessmentConfig from "@/app/(authenticated)/college/assessments/preview-config-assessment/[id]/page";
import React from "react";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  return <AssessmentConfig params={params} />;
};

export default Page;
