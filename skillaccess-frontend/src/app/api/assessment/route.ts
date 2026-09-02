import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    // Debug logs
    console.log("Auth Header:", authHeader);
    console.log("Request body:", body);

    // Make sure we have an auth header
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments`,
      body,
      {
        headers: {
          // Use the auth header as-is (it may already include "Bearer")
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
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

export async function GET(request: Request) {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments`
    );
    return NextResponse.json(response.data, { status: response.status });
  } catch (err) {
    console.log("Error is : ", err);
  }
}
