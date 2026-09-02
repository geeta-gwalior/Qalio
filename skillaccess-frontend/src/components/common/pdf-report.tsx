"use client";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Extremely simplified styles - only basic properties that react-pdf definitely supports
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
  mainContent: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start", // ensures everything flows top-down
  },
  // Updated header layout for logo and page numbers
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  logoContainer: {
    alignItems: "flex-start",
  },
  logo: {
    maxWidth: 120,
    maxHeight: 40,
    objectFit: "contain", // Optional, works for react-pdf >=3.x (safe fallback ignored silently)
  },
  pageNumberContainer: {
    alignItems: "flex-end",
  },
  pageNumber: {
    fontSize: 10,
    color: "#666666",
  },
  // Header section - very basic
  header: {
    backgroundColor: "#219CAE",
    padding: 20,
    marginBottom: 20,
    color: "#ffffff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  // Content sections
  section: {
    //  marginBottom: 20,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#219CAE",
    marginBottom: 10,
    borderBottom: "1px solid #219CAE",
    paddingBottom: 5,
  },
  // Statistics - simple grid
  statsContainer: {
    backgroundColor: "#ffffff", // ⬅️ Match the main background to remove visual difference
    padding: 0, // ⬅️ Remove internal spacing
    marginBottom: 15, // Optional — keep if spacing below is still needed
  },

  statRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
    marginRight: 10,
    border: "1px solid #219CAE",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#219CAE",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 9,
    color: "#000000",
  },
  // Table - very basic
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#219CAE",
    color: "#ffffff",
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #cccccc",
    padding: 8,
  },
  tableRowEven: {
    backgroundColor: "#f9f9f9",
  },
  // Table cells - basic flex
  cellRank: {
    flex: 1,
    fontSize: 9,
  },
  cellName: {
    flex: 3,
    fontSize: 9,
  },
  cellEmail: {
    flex: 4,
    fontSize: 9,
  },
  cellScore: {
    flex: 2,
    fontSize: 9,
  },
  cellStatus: {
    flex: 2,
    fontSize: 9,
  },
  // Status styling - very simple
  statusSelected: {
    color: "#008000",
    fontWeight: "bold",
  },
  statusRejected: {
    color: "#800000",
    fontWeight: "bold",
  },
  // Topics section
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10, // Add horizontal/vertical gap if supported
    rowGap: 10,
    columnGap: 10,
    justifyContent: "flex-start",
    marginBottom: 10,
    backgroundColor: "#ffffff",
    padding: 0,
  },

  topicItem: {
    width: 150, // fixed width
    height: 100, // fixed height
    padding: 8,
    marginRight: 10,
    marginBottom: 10,
    border: "1px solid #219CAE",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
    display: "flex",
    justifyContent: "space-between",
  },
  topicTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 3,
  },
  topicDescription: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 5,
  },
  topicWeightage: {
    fontSize: 9,
    color: "#219CAE",
    fontWeight: "bold",
  },
  // Footer
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: "1px solid #219CAE",
    fontSize: 8,
    color: "#666666",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // Simple chart representation
  chartContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#219CAE",
  },
  chartBar: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "center",
  },
  chartLabel: {
    fontSize: 9,
    width: 60,
  },
  chartBarFill: {
    backgroundColor: "#219CAE",
    height: 15,
    marginRight: 5,
  },
  chartValue: {
    fontSize: 9,
    color: "#219CAE",
    fontWeight: "bold",
  },
});

const SimplePDFReport = ({ transformedData }: { transformedData: any }) => {
  // Safe data extraction with defaults
  const assessment = transformedData?.assessment || {};
  const statistics = transformedData?.statistics || {};
  const candidates = transformedData?.candidates || [];

  // Safe number conversion
  const safeNumber = (value: any) => {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Generate score distribution for simple chart
  const getScoreDistribution = () => {
    const ranges = [
      { label: "0-20%", count: 0 },
      { label: "21-40%", count: 0 },
      { label: "41-60%", count: 0 },
      { label: "61-80%", count: 0 },
      { label: "81-100%", count: 0 },
    ];

    candidates.forEach((candidate: any) => {
      const percentage = safeNumber(candidate?.percentage);
      if (percentage <= 20) ranges[0].count++;
      else if (percentage <= 40) ranges[1].count++;
      else if (percentage <= 60) ranges[2].count++;
      else if (percentage <= 80) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  };

  const scoreDistribution = getScoreDistribution();
  const maxCount = Math.max(...scoreDistribution.map((r) => r.count));

  // Updated pagination logic - exactly 18 candidates per page
  const CANDIDATES_PER_PAGE = 18;
  const candidatePages = [];
  for (let i = 0; i < candidates.length; i += CANDIDATES_PER_PAGE) {
    candidatePages.push(candidates.slice(i, i + CANDIDATES_PER_PAGE));
  }

  // Table header component
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={styles.cellRank}>No.</Text>
      <Text style={styles.cellName}>Name</Text>
      <Text style={styles.cellEmail}>Email</Text>
      <Text style={styles.cellScore}>Score</Text>
      <Text style={styles.cellStatus}>Status</Text>
    </View>
  );

  // Page header component with logo and page number
  const PageHeader = ({
    pageNumber,
    isFirstPage = false,
  }: {
    pageNumber?: number;
    isFirstPage?: boolean;
  }) => (
    <View style={styles.pageHeader}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} src="/images/skill_access_logo.png" />
      </View>
      {!isFirstPage && pageNumber && (
        <View style={styles.pageNumberContainer}>
          <Text style={styles.pageNumber}>Page {pageNumber}</Text>
        </View>
      )}
    </View>
  );

  const totalPages = candidatePages.length > 0 ? candidatePages.length + 1 : 1;

  const paginateTopics = (topics: any, maxPerPage = 3) => {
    const pages = [];
    for (let i = 0; i < topics.length; i += maxPerPage) {
      pages.push(topics.slice(i, i + maxPerPage));
    }
    return pages;
  };

  const topicPages = paginateTopics(assessment.topics || [], 3);

  return (
    <Document
      title="Qalio | Assessment & Hiring Platform"
      subject="Assessment Report"
      author="Qalio"
      keywords="assessment, hiring, recruitment, talent, evaluation"
      creator="Qalio Platform"
      producer="Qalio Assessment System"
    >
      {/* First Page - Overview and Summary */}
      <Page size="A4" style={styles.page}>
        <PageHeader isFirstPage={true} />

        {/* MAIN CONTENT */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {assessment.name || "Assessment Report"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Qalio | Assessment & Hiring Platform
            </Text>
            <Text style={styles.headerSubtitle}>
              Smart assessment platform designed for students, colleges,
              companies, and universities
            </Text>
            <Text style={styles.headerSubtitle}>
              Generated: {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Executive Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {safeNumber(statistics.averageScore).toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {safeNumber(statistics.selectedCount)}
                  </Text>
                  <Text style={styles.statLabel}>Selected</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {safeNumber(statistics.rejectedCount)}
                  </Text>
                  <Text style={styles.statLabel}>Rejected</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {safeNumber(statistics.passRate)}%
                  </Text>
                  <Text style={styles.statLabel}>Pass Rate</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Score Distribution Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Distribution</Text>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Performance Analysis</Text>
              {scoreDistribution.map((range, index) => (
                <View key={index} style={styles.chartBar}>
                  <Text style={styles.chartLabel}>{range.label}</Text>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        width:
                          maxCount > 0 ? (range.count / maxCount) * 200 : 0,
                      },
                    ]}
                  />
                  <Text style={styles.chartValue}>{range.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Assessment Topics */}
          {assessment.topics && assessment.topics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessment Topics</Text>
              <View style={styles.topicsContainer}>
                {assessment.topics.map((topic: any, index: number) => (
                  <View key={index} wrap={false} style={styles.topicItem}>
                    <Text style={styles.topicTitle}>
                      {topic?.heading || "Topic"}
                    </Text>
                    <Text style={styles.topicDescription}>
                      {topic?.description || "No description"}
                    </Text>
                    <Text style={styles.topicWeightage}>
                      {safeNumber(topic?.weightage)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text>
              © {new Date().getFullYear()} Qalio. All rights reserved.
            </Text>
            <Text>Confidential Assessment Report</Text>
          </View>
        </View>
      </Page>

      {/* Candidate Table Pages */}
      {candidatePages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <PageHeader pageNumber={pageIndex + 2} />

          <View style={styles.mainContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {pageIndex === 0
                  ? "Candidate Performance"
                  : "Candidate Performance (Continued)"}
              </Text>
              <View style={styles.table}>
                <TableHeader />
                {pageData.map(
                  (
                    candidate: {
                      name?: string;
                      email?: string;
                      score?: number;
                      percentage?: number;
                      status?: string;
                    },
                    index: number
                  ) => {
                    const globalIndex = pageIndex * CANDIDATES_PER_PAGE + index;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.tableRowEven : {},
                        ]}
                      >
                        <Text style={styles.cellRank}>{globalIndex + 1}</Text>
                        <Text style={styles.cellName}>
                          {candidate?.name || "N/A"}
                        </Text>
                        <Text style={styles.cellEmail}>
                          {candidate?.email || "N/A"}
                        </Text>
                        <Text style={styles.cellScore}>
                          {safeNumber(candidate?.score)}/
                          {safeNumber(assessment.totalMarks) || 100} (
                          {safeNumber(candidate?.percentage)}%)
                        </Text>
                        <Text
                          style={[
                            styles.cellStatus,
                            candidate?.status === "selected"
                              ? styles.statusSelected
                              : styles.statusRejected,
                          ]}
                        >
                          {candidate?.status === "selected"
                            ? "SELECTED"
                            : "NOT SELECTED"}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text>
                © {new Date().getFullYear()} Qalio. All rights reserved.
              </Text>
              <Text>Confidential Assessment Report</Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default SimplePDFReport;
