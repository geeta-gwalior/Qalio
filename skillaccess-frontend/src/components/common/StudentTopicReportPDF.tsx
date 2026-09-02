import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatDateTime } from "@/utils/formatDate";
const generateComment = (percentage: number) => {
  if (percentage >= 85)
    return " Excellent performance. The student has demonstrated a strong understanding across topics.";
  if (percentage >= 60)
    return " Satisfactory performance. There's good understanding, but more practice is recommended.";
  return " Needs significant improvement. The student should review the topics and practice more.";
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "bold",
  },

  bodyText: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 1.5,
  },

  logoContainer: {
    marginBottom: 20,
    alignItems: "flex-start",
  },
  logo: {
    maxWidth: 120,
    maxHeight: 40,
    objectFit: "contain",
  },
  section: {
    marginBottom: 12,
  },
  table: {
    flexDirection: "column", // ✅ mimics table rows
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
  },
  tableCellHeader: {
    fontWeight: "bold",
    padding: 5,
    borderRight: "1 solid black",
    backgroundColor: "#219CAE",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  tableCell: {
    padding: 5,
    borderRight: "1 solid black",
    flex: 1,
    textAlign: "center",
  },
});

const StudentTopicReportPDF = ({
  assessment,
  selectedAttempt,
  student,
}: any) => {
  // Create questionId -> topic mapping and topic-wise score aggregation
  const questionToTopicMap: Record<string, string> = {};
  const topicMarks: Record<string, { obtained: number; total: number }> = {};

  assessment.topics.forEach((topic: any) => {
    topicMarks[topic.heading] = { obtained: 0, total: 0 };
    topic.selectedQuestions.forEach((q: any) => {
      questionToTopicMap[q.questionId] = topic.heading;
      topicMarks[topic.heading].total += q.totalMarks;
    });
  });

  selectedAttempt.responses.forEach((response: any) => {
    const questionId = response.questionId._id;
    const topic = questionToTopicMap[questionId];
    if (topic) {
      topicMarks[topic].obtained += response.marksAwarded || 0;
    }
  });

  const calculatePercentage = (obtained: number, total: number) => {
    if (total === 0) return "0%";
    return `${((obtained / total) * 100).toFixed(1)}%`;
  };
  const totalScored = selectedAttempt.totalMarksScored || 0;
  const totalMarks = assessment.totalMarks || 0;
  const percentage = totalMarks > 0 ? (totalScored / totalMarks) * 100 : 0;
  const comment = generateComment(percentage);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} src="/images/skill_access_logo.png" />
        </View>
        <View style={styles.section}></View>
        <Text style={styles.heading}>Topic-wise Assessment Report</Text>
        <View
          style={{
            border: "1 solid #ddd",
            padding: 10,
            marginBottom: 16,
            backgroundColor: "#f9f9f9",
          }}
        >
          <Text style={styles.greeting}>
            Dear {student?.name || "Student"},
          </Text>
          <Text style={styles.bodyText}>
  Thank you for participating in the assessment titled &quot;
  <Text style={{ fontWeight: "bold" }}>{assessment?.name}</Text>
  &quot; conducted on{" "}
  {selectedAttempt?.submittedAt
    ? formatDateTime(selectedAttempt.submittedAt)
    : "N/A"}
  .
</Text>

          <Text style={styles.bodyText}>
            You scored{" "}
            <Text style={{ fontWeight: "bold" }}>
              {selectedAttempt?.totalMarksScored} / {assessment?.totalMarks}
            </Text>{" "}
            in this assessment.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellHeader}>Topic</Text>
            <Text style={styles.tableCellHeader}>Marks Obtained</Text>
            <Text style={styles.tableCellHeader}>Total Marks</Text>
            <Text style={styles.tableCellHeader}>Score %</Text>
          </View>

          {Object.entries(topicMarks).map(([topic, marks]) => (
            <View style={styles.tableRow} key={topic}>
              <Text style={styles.tableCell}>{topic}</Text>
              <Text style={styles.tableCell}>{marks.obtained}</Text>
              <Text style={styles.tableCell}>{marks.total}</Text>
              <Text style={styles.tableCell}>
                {calculatePercentage(marks.obtained, marks.total)}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 6,
              borderBottom: "1 solid #ccc",
              paddingBottom: 4,
            }}
          >
            Remarks
          </Text>
          <Text style={{ fontSize: 12, lineHeight: 1.5 }}>{comment}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default StudentTopicReportPDF;
