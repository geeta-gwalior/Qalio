import { ResultsAnalytics } from "./resultsAnalyticsGraph";
import StatCard from "./stat-card";

interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
  textColor: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  fullName: string;
  createdAt?: string;
  assessmentName?: string;
  invitedCount?: number;
  status?: string;
}

interface OverviewSectionProps {
  stats: StatCardProps[];
  divClassName?: string;
  chartData?: ChartDataItem[];
  chartTitle?: string;
  yAxisLabel?: string;
}

export default function OverviewSection({
  stats,
  divClassName,
  chartData = [],
  chartTitle,
}: OverviewSectionProps) {
  const containerClass = divClassName
    ? `${divClassName}`
    : "w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6";

  // Determine chart labels and title based on data type or use provided title
  const isResultsData = chartData.some((item) => item.assessmentName);
  const isAssessmentData = chartData.some(
    (item) => item.invitedCount !== undefined
  );

  const yAxisLabel = isAssessmentData
    ? "Appeared Students"
    : isResultsData
    ? "Appeared Candidates"
    : "Days Since Creation";

  const finalChartTitle =
    chartTitle ||
    (isAssessmentData
      ? "Assessment Analytics"
      : isResultsData
      ? "Results Analytics"
      : "Jobs Creation Timeline");

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={containerClass}>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            bgColor={stat.bgColor}
            textColor={stat.textColor}
          />
        ))}
      </div>
      <div className="w-full overflow-hidden ">
        <ResultsAnalytics
          data={chartData}
          xAxisKey="name"
          yAxisKey="value"
          xAxisLabel="Assessment Names"
          yAxisLabel={yAxisLabel}
          title={finalChartTitle}
        />
      </div>
    </div>
  );
}
