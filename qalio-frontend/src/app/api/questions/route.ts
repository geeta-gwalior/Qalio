import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("👉 Adding new question:", data);

    const postResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/question`,
      data
    );

    const addedQuestion = postResponse.data;

    const topicId = data.topicId;
    console.log(topicId);

    const questionId = addedQuestion._id || addedQuestion.data?._id;
    console.log(questionId);
    if (!topicId || !questionId) {
      throw new Error("Missing topicId or questionId for PATCH request");
    }

    // PATCH request to add question to topic
    const patchResponse = await axios.patch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/topic/${topicId}/add-questions`,
      {
        questionIds: [questionId],
      }
    );

    return NextResponse.json({
      success: true,
      message: "Question added and linked to topic",
      data: {
        addedQuestion: addedQuestion,
        topicUpdate: patchResponse.data,
      },
    });
  } catch (error: any) {
    console.log(" Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // In a real application, you would fetch this from a database
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    console.log("Fetching questions for topic:", topicId);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock data
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
