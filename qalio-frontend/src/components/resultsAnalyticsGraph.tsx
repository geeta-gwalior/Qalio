"use client";

import { ChevronDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ChartDataItem {
  name: string;
  value: number;
  fullName?: string;
  assessmentName?: string;
  totalMarks?: number;
  percentage?: number;
  status?: string;
  level?: string;
  totalAttempts?: number;
  totalTime?: number;
  isShortlisted?: boolean;
  submittedAt?: string;
  invitedCount?: number;
  participationRate?: number;
  type?: string;
  isReportGenerated?: boolean;
  createdAt?: string;
  daysAgo?: number;
  [key: string]: any;
}

interface ResultsAnalyticsProps {
  data?: ChartDataItem[];
  xAxisKey?: string;
  yAxisKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
}

const defaultChartData = [
  { name: "S", value: 20 },
  { name: "M", value: 35 },
  { name: "T", value: 45 },
  { name: "W", value: 68, highlight: true },
  { name: "T", value: 65 },
  { name: "F", value: 80 },
  { name: "S", value: 100 },
];

export function ResultsAnalytics({
  data = defaultChartData,
  xAxisKey = "name",
  yAxisKey = "value",
  xAxisLabel = "Period",
  yAxisLabel = "Results",
  title = "Results Analytics",
}: ResultsAnalyticsProps) {
  const [timeFilter, setTimeFilter] = useState("Weekly");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartConfig = {
    [yAxisKey]: {
      label: yAxisLabel,
      color: "hsl(195, 83%, 90%)",
    },
  };

  // Function to wrap long labels into multiple lines (max 8 words per line)
  const formatLabel = (label: string, maxWordsPerLine = 8) => {
    const words = label.split(" ");
    if (words.length <= maxWordsPerLine) return label;

    const lines = [];
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(" "));
    }
    return lines.join("\n");
  };

  // Calculate dynamic Y-axis domain - keep it simple
  const maxValue = Math.max(...data.map((item) => item[yAxisKey] || 0));
  const minValue = Math.min(...data.map((item) => item[yAxisKey] || 0));

  // Ensure we have a reasonable range
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 10;
  const yAxisMin = 0; // Always start from 0

  // Responsive scrolling logic
  const getScrollThreshold = () => {
    if (isMobile) return 3; // Mobile: scroll after 3 items
    return 6; // Desktop: scroll after 6 items
  };

  const needsScrolling = data.length > getScrollThreshold();

  // Optimized chart dimensions
  const getChartDimensions = () => {
    if (isMobile) {
      return {
        itemWidth: 100,
        minWidth: 300,
        height: 280,
      };
    }
    return {
      itemWidth: 120,
      minWidth: 400,
      height: 320,
    };
  };

  const { itemWidth, minWidth, height } = getChartDimensions();
  const chartWidth = needsScrolling
    ? Math.max(data.length * itemWidth + (isMobile ? 30 : 35), minWidth)
    : itemWidth * data.length + 100; // Always return a number

  // Enhanced tooltip content that works for all dashboard types
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border rounded-lg  max-w-xs max-h-80 overflow-y-auto z-50">
          <div className="p-3">
            <p className="font-semibold text-sm mb-2 break-words sticky top-0 bg-white pb-2 border-b">
              {data.fullName || data.assessmentName || label}
            </p>

            {/* College assessment-specific metrics - CHECK THIS FIRST */}
            {data.invitedCount !== undefined ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-indigo-600 text-sm font-medium">{`Appeared: ${payload[0].value} students`}</p>
                  <p className="text-indigo-600 text-sm font-medium">{`Invited: ${data.invitedCount} students`}</p>
                  <p className="text-indigo-600 text-sm font-medium">{`Participation: ${data.participationRate}%`}</p>
                </div>

                {/* Additional assessment details */}
                <div className="border-t pt-2 space-y-1">
                  <p className="text-xs text-gray-600">{`Level: ${
                    data.level || "N/A"
                  }`}</p>
                  <p className="text-xs text-gray-600">{`Status: ${
                    data.status || "N/A"
                  }`}</p>
                  {data.totalMarks && (
                    <p className="text-xs text-gray-600">{`Total Marks: ${data.totalMarks}`}</p>
                  )}
                  {data.totalTime && (
                    <p className="text-xs text-gray-600">{`Duration: ${data.totalTime} min`}</p>
                  )}
                  {data.totalQuestions && (
                    <p className="text-xs text-gray-600">{`Questions: ${data.totalQuestions}`}</p>
                  )}
                  {/* {data.type && (
                    <p className="text-xs text-gray-600">{`Type: ${data.type.toUpperCase()}`}</p>
                  )} */}
                  {/* {data.isReportGenerated && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Report Generated
                    </p>
                  )} */}
                </div>

                {data.createdAt && (
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(data.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : data.percentage !== undefined ? (
              // Student assessment-specific metrics - CHECK PERCENTAGE FOR STUDENTS
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-[#219CAE] text-sm font-medium">{`Marks Scored: ${payload[0].value}/${data.totalMarks}`}</p>
                  <p className="text-[#219CAE] text-sm font-medium">{`Percentage: ${data.percentage}%`}</p>
                </div>

                {/* Additional assessment details */}
                <div className="border-t pt-2 space-y-1">
                  <p className="text-xs text-gray-600">{`Level: ${
                    data.level || "N/A"
                  }`}</p>
                  <p className="text-xs text-gray-600">{`Total Attempts: ${
                    data.totalAttempts || 1
                  }`}</p>
                  {data.totalTime && (
                    <p className="text-xs text-gray-600">{`Duration: ${data.totalTime} min`}</p>
                  )}
                  {data.isShortlisted && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Shortlisted
                    </p>
                  )}
                </div>

                {data.submittedAt && (
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(data.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : data.department !== undefined ? (
              // Company job-specific metrics
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-[#219CAE] text-sm font-medium">{`Applications: ${payload[0].value}`}</p>
                  <p className="text-[#219CAE] text-sm font-medium">{`Department: ${data.department}`}</p>
                  <p className="text-[#219CAE] text-sm font-medium">{`Status: ${data.status}`}</p>
                </div>

                {/* Additional job details */}
                <div className="border-t pt-2 space-y-1">
                  {data.location && (
                    <p className="text-xs text-gray-600">{`Location: ${data.location}`}</p>
                  )}
                  <p className="text-xs text-gray-600">{`Created: ${data.daysAgo} days ago`}</p>
                </div>

                {data.createdAt && (
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(data.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ) : data.daysAgo !== undefined ? (
              <p className="text-indigo-600 font-semibold">{`Created: ${data.daysAgo} days ago`}</p>
            ) : (
              <p className="text-indigo-600 font-semibold">{`${yAxisLabel}: ${payload[0].value}`}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      id="resultchart"
      className="border-none shadow-none p-2 px-1 w-full max-w-full overflow-hidden"
    >
      <CardHeader className="flex flex-row items-center justify-between px-1 pb-1 pt-2">
        <CardTitle className="text-sm md:text-base font-semibold text-gray-700 truncate">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pr-1 md:pr-2 pb-2">
        <div className="w-full" style={{ height: `${height}px` }}>
          {needsScrolling && (
            <div className="text-xs text-gray-500 mb-2 text-center">
              Scroll horizontally to view all {data.length} items →
            </div>
          )}

          <div className="relative w-full h-full">
            {needsScrolling ? (
              <div className="flex h-full">
                <div
                  className="flex-shrink-0 relative"
                  style={{ width: isMobile ? "55px" : "60px" }}
                >
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={[data[0]]} // Just one data point for Y-axis reference
                      width={isMobile ? 55 : 60}
                      height={height}
                      margin={{
                        left: isMobile ? 8 : 10,
                        right: 0,
                        top: 20,
                        bottom: isMobile ? 15 : 47,
                      }}
                    >
                      <YAxis
                        tickCount={isMobile ? 4 : 5}
                        domain={[yAxisMin, yAxisMax]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={isMobile ? 4 : 6}
                        stroke="#9ca3af"
                        tickFormatter={(value) => value.toString()}
                        tick={{ fontSize: isMobile ? 10 : 11 }}
                        width={isMobile ? 45 : 50}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>

                {/* Scrollable chart area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden w-full">
                  <div style={{ width: chartWidth, height: "100%" }}>
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <AreaChart
                        accessibilityLayer
                        data={data}
                        width={chartWidth as number}
                        height={height}
                        margin={{
                          left: isMobile ? 20 : 25,
                          right: isMobile ? 35 : 45,
                          top: 20,
                          bottom: isMobile ? 15 : 20,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="colorValue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                        />
                        <XAxis
                          dataKey={xAxisKey}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={2}
                          stroke="#64748b"
                          angle={0}
                          textAnchor="middle"
                          height={isMobile ? 25 : 30}
                          interval={0}
                          tickFormatter={(value) =>
                            formatLabel(value, isMobile ? 6 : 8)
                          }
                          tick={{
                            fontSize: isMobile ? 10 : 11,
                            width: isMobile ? 60 : 70,
                          }}
                        />
                        <YAxis
                          hide
                          tickCount={isMobile ? 4 : 5}
                          domain={[yAxisMin, yAxisMax]}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<CustomTooltip />}
                        />
                        <Area
                          dataKey={yAxisKey}
                          type="monotone"
                          fill="url(#colorValue)"
                          fillOpacity={1}
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="h-full w-full max-w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={data}
                  width={undefined}
                  height={height}
                  margin={{
                    left: isMobile ? 12 : 15,
                    right: isMobile ? 35 : 45,
                    top: 20,
                    bottom: isMobile ? 15 : 33,
                  }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#6366f1"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey={xAxisKey}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={2}
                    stroke="#64748b"
                    angle={0}
                    textAnchor="middle"
                    height={isMobile ? 25 : 30}
                    interval={0}
                    tickFormatter={(value) =>
                      formatLabel(value, isMobile ? 6 : 8)
                    }
                    tick={{
                      fontSize: isMobile ? 10 : 11,
                      width: isMobile ? 60 : 70,
                    }}
                  />
                  <YAxis
                    tickCount={isMobile ? 4 : 5}
                    domain={[yAxisMin, yAxisMax]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={isMobile ? 4 : 6}
                    stroke="#64748b"
                    tickFormatter={(value) => value.toString()}
                    tick={{ fontSize: isMobile ? 10 : 11 }}
                    width={isMobile ? 45 : 50}
                  />
                  <ChartTooltip cursor={false} content={<CustomTooltip />} />
                  <Area
                    dataKey={yAxisKey}
                    type="monotone"
                    fill="url(#colorValue)"
                    fillOpacity={1}
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
