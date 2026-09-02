import { notFound } from "next/navigation";
import CompanyJobDetailsView from "@/components/jobs/company-job-details-view";
import { getCookie } from "@/utils/getCookie";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await getJob(id);
  console.log("Job Details:", job);

  if (!job) {
    notFound();
  }

  return (
    <div>
      <CompanyJobDetailsView job={job} />
    </div>
  );
}

// Fixed: Use /jobs instead of /job
async function getJob(id: string) {
  try {
    const token = getCookie("jwt");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.job || data; // Handle both response formats
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}
