import axios from "axios";
import { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Get all query parameters
    const page = searchParams.get("page") || "1";
    const sort_field = searchParams.get("sort_field") || "";
    const sort_type = searchParams.get("sort_type") || "";
    const sort_lang = searchParams.get("sort_lang") || "";
    const category = searchParams.get("category") || "";
    const country = searchParams.get("country") || "";
    const year = searchParams.get("year") || "";
    const limit = searchParams.get("limit") || "";

    // Build query string with only non-empty parameters
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);

    if (sort_field) queryParams.append("sort_field", sort_field);
    if (sort_type) queryParams.append("sort_type", sort_type);
    if (sort_lang) queryParams.append("sort_lang", sort_lang);
    if (category) queryParams.append("category", category);
    if (country) queryParams.append("country", country);
    if (year) queryParams.append("year", year);
    if (limit) queryParams.append("limit", limit);

    const apiUrl = `${API_URL}/v1/api/danh-sach/${slug}?${queryParams.toString()}`;

    const response = await axios.get(apiUrl);
    return Response.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
