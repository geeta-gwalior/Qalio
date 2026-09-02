import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const id = pathname.split("/").pop();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}`
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const id = pathname.split("/").pop();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}`,
      body
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update topic" },
      { status: 500 }
    );
  }
}
