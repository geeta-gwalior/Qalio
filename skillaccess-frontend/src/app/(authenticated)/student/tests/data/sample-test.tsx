export const sampleTest = {
  id: "test-001",
  title: "Beginner Level Assessment",
  company: "Dyson Technologies",
  duration: 60, // in minutes
  questions: [
    {
      id: "q1",
      type: "multiple-choice",
      section: "Technical Knowledge",
      text: "Which of the following is NOT a valid JavaScript data type?",
      points: 5,
      timeLimit: 60, // in seconds
      options: [
        { id: "a", text: "String" },
        { id: "b", text: "Boolean" },
        { id: "c", text: "Float" },
        { id: "d", text: "Symbol" },
      ],
    },
    {
      id: "q2",
      type: "multiple-select",
      section: "Technical Knowledge",
      text: "Which of the following are JavaScript frameworks or libraries? (Select all that apply)",
      points: 5,
      timeLimit: 90, // in seconds
      options: [
        { id: "a", text: "React" },
        { id: "b", text: "Angular" },
        { id: "c", text: "Java" },
        { id: "d", text: "Vue" },
        { id: "e", text: "Python" },
      ],
    },
    {
      id: "q3",
      type: "essay",
      section: "Problem Solving",
      text: "Explain how you would approach debugging a complex web application performance issue.",
      description:
        "Include specific tools and methodologies you would use in your process.",
      minWords: 100,
      points: 15,
      timeLimit: 300, // in seconds
    },
    {
      id: "q4",
      type: "coding",
      section: "Coding Skills",
      text: "Write a function that finds the most frequent element in an array.",
      description:
        "Your function should return the most frequent element. If there are multiple elements with the same frequency, return the one that appears first in the array.",
      language: "JavaScript",
      points: 20,
      timeLimit: 240, // in seconds
      testCases: [
        { input: "[1, 2, 3, 2, 4, 2, 5]", output: "2" },
        { input: "['a', 'b', 'c', 'a', 'd']", output: "'a'" },
      ],
    },
    {
      id: "q5",
      type: "file-upload",
      section: "Project Submission",
      text: "Upload your solution to the design challenge.",
      description:
        "Please submit your design as a PDF file. The file should include your wireframes and explanations.",
      allowedTypes: [".pdf", ".zip"],
      maxSize: "10MB",
      points: 25,
      timeLimit: 180, // in seconds
    },
    {
      id: "q6",
      type: "video-recording",
      section: "Communication Skills",
      text: "Record a short video explaining your approach to the design challenge.",
      description:
        "Explain your thought process, design decisions, and how your solution addresses the requirements.",
      maxDuration: "2 minutes",
      points: 15,
      timeLimit: 180, // in seconds
    },
    {
      id: "q7",
      type: "multiple-choice",
      section: "Technical Knowledge",
      text: "What does CSS stand for?",
      points: 5,
      timeLimit: 45, // in seconds
      options: [
        { id: "a", text: "Computer Style Sheets" },
        { id: "b", text: "Creative Style Sheets" },
        { id: "c", text: "Cascading Style Sheets" },
        { id: "d", text: "Colorful Style Sheets" },
      ],
    },
    {
      id: "q8",
      type: "audio-recording",
      section: "Communication Skills",
      text: "Record an audio explanation of how you would handle a difficult client situation.",
      description:
        "Describe a specific scenario and your approach to resolving it professionally.",
      maxDuration: "90 seconds",
      points: 10,
      timeLimit: 150, // in seconds
    },
    {
      id: "q9",
      type: "multiple-choice",
      section: "Technical Knowledge",
      text: "Which HTTP status code represents a successful request?",
      points: 5,
      timeLimit: 45, // in seconds
      options: [
        { id: "a", text: "200 OK" },
        { id: "b", text: "404 Not Found" },
        { id: "c", text: "500 Internal Server Error" },
        { id: "d", text: "302 Found" },
      ],
    },
    {
      id: "q10",
      type: "essay",
      section: "Problem Solving",
      text: "Describe a challenging technical problem you've solved and your approach to solving it.",
      minWords: 150,
      points: 15,
      timeLimit: 300, // in seconds
      resources: [
        {
          type: "text",
          title: "Problem-Solving Framework",
          content:
            "When describing your problem-solving approach, consider including: 1) Problem identification, 2) Analysis of root causes, 3) Solution exploration, 4) Implementation strategy, 5) Results and lessons learned.",
        },
      ],
    },
  ],
};
