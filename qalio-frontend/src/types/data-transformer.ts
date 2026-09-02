// Utility functions to transform and validate data

export interface RawAssessmentData {
    assessmentName?: string
    assessmentId?: string
    totalMarks?: number
    candidates?: Array<{
      name?: string
      email?: string
      score?: number
      status?: string
    }>
    topics?: Array<{
      heading?: string
      description?: string
      weightage?: number
    }>
  }
  
  export interface TransformedData {
    assessment: {
      name: string
      assessmentId: string
      totalMarks: number
      topics: Array<{
        heading: string
        description: string
        weightage: number
      }>
    }
    statistics: {
      averageScore: number
      selectedCount: number
      rejectedCount: number
      passRate: number
    }
    candidates: Array<{
      name: string
      email: string
      score: number
      percentage: number
      status: "selected" | "rejected"
    }>
  }
  
  export const transformAssessmentData = (rawData: RawAssessmentData): TransformedData => {
    // Validate and transform candidates
    const validCandidates = (rawData.candidates || [])
      .filter((candidate) => candidate && candidate.name && candidate.email)
      .map((candidate) => {
        const score = candidate.score || 0
        const totalMarks = rawData.totalMarks || 100
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
  
        return {
          name: candidate.name || "Unknown",
          email: candidate.email || "unknown@example.com",
          score,
          percentage,
          status: (candidate.status === "selected" ? "selected" : "rejected") as "selected" | "rejected",
        }
      })
  
    // Calculate statistics
    const selectedCount = validCandidates.filter((c) => c.status === "selected").length
    const rejectedCount = validCandidates.length - selectedCount
    const averageScore =
      validCandidates.length > 0 ? validCandidates.reduce((sum, c) => sum + c.score, 0) / validCandidates.length : 0
    const passRate = validCandidates.length > 0 ? Math.round((selectedCount / validCandidates.length) * 100) : 0
  
    // Validate and transform topics
    const validTopics = (rawData.topics || [])
      .filter((topic) => topic && topic.heading)
      .map((topic) => ({
        heading: topic.heading || "Untitled Topic",
        description: topic.description || "No description available",
        weightage: topic.weightage || 0,
      }))
  
    return {
      assessment: {
        name: rawData.assessmentName || "Assessment Report",
        assessmentId: rawData.assessmentId || "ASS-" + Date.now(),
        totalMarks: rawData.totalMarks || 100,
        topics: validTopics,
      },
      statistics: {
        averageScore,
        selectedCount,
        rejectedCount,
        passRate,
      },
      candidates: validCandidates,
    }
  }
  
  export const validateTransformedData = (data: any): data is TransformedData => {
    return (
      data &&
      typeof data === "object" &&
      data.assessment &&
      data.statistics &&
      Array.isArray(data.candidates) &&
      typeof data.assessment.name === "string" &&
      typeof data.statistics.averageScore === "number"
    )
  }
  