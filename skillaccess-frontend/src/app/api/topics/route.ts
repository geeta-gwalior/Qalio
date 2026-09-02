import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "No authorization token provided" },
        { status: 401 }
      );
    }

    const requestData = {
      heading: data.name,
      description: data.description,
    };

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/topic`,
      requestData,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Topic created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Error creating topic:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || "Failed to create topic",
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create topic" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "No authorization token provided" },
        { status: 401 }
      );
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/topic`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Topics fetched successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: error.response?.data?.message || "Failed to fetch topics",
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
