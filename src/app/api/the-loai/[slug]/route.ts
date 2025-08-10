import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const sortField = searchParams.get("sort_field") || "modified.time";
    const sortType = searchParams.get("sort_type") || "desc";
    const sortLang = searchParams.get("sort_lang") || "";
    const country = searchParams.get("country") || "";
    const year = searchParams.get("year") || "";
    const limit = searchParams.get("limit") || "10";

    // Build query parameters
    const queryParams = new URLSearchParams({
      page,
      sort_field: sortField,
      sort_type: sortType,
    });

    if (sortLang) queryParams.append("sort_lang", sortLang);
    if (country) queryParams.append("country", country);
    if (year) queryParams.append("year", year);
    if (limit) queryParams.append("limit", limit);

    const response = await axios.get(
      `${API_URL}/v1/api/the-loai/${slug}?${queryParams.toString()}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching thể loại data:", error);
    return NextResponse.json(
      { error: "Failed to fetch thể loại data" },
      { status: 500 }
    );
  }
}
