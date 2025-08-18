import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/prisma.types";

// POST /api/auth/logout - Đăng xuất
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Token không hợp lệ",
        } as ApiResponse<never>,
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    await prisma.session.deleteMany({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: "Đăng xuất thành công",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi server",
      } as ApiResponse<never>,
      { status: 500 },
    );
  }
}
