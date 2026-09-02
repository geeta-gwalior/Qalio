import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/topic/${id}`
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const id = pathname.split("/").pop();
  const body = await request.json();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID is missing" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/topic/${id}`,
      {
        questionType: body.questionType,
      }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to Add to topic topic" },
      { status: 500 }
    );
  }
}
