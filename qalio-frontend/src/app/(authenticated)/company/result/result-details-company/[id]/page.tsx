import ResultDetails from "@/app/(authenticated)/college/result/result-details/[id]/page";
import React from "react";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  return <ResultDetails params={params} />;
};

export default Page;
