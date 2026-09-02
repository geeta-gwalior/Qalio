import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Coding Data:", body);
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/question/`,
      body
    );

    // Return the response from the backend
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error("Error saving assessment:", error);

    // Handle axios errors specifically
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: error.response?.data?.message || "Assessment creation failed",
          details: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
