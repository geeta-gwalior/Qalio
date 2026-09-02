import type { Metadata } from "next";
import JobCreationForm from "@/components/jobs/job-creation-form";
import { BackHeader } from "@/components/backHeader";

export const metadata: Metadata = {
  title: "Create Job",
  description: "Create a new job posting",
};

export default function CreateJobPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <BackHeader title={"Back to Jobs"} defaultRoute="/company/jobs" />
      </div>
      <div className="flex flex-col gap-6">
        <JobCreationForm />
      </div>
    </div>
  );
}
