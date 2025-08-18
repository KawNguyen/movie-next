import { SearchApiResponse } from "@/types/movie-list.types";
import { NextRequest, NextResponse } from "next/server";

interface SearchParams {
  keyword?: string;
  page?: string;
  sort_field?: string;
  sort_type?: string;
  sort_lang?: string;
  category?: string;
  country?: string;
  year?: string;
  limit?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: SearchParams = {
      keyword: searchParams.get("keyword") || "",
      page: searchParams.get("page") || "1",
      sort_field: searchParams.get("sort_field") || undefined,
      sort_type: searchParams.get("sort_type") || undefined,
      sort_lang: searchParams.get("sort_lang") || undefined,
      category: searchParams.get("category") || undefined,
      country: searchParams.get("country") || undefined,
      year: searchParams.get("year") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    if (!params.keyword || params.keyword.trim() === "") {
      return NextResponse.json(
        {
          status: false,
          msg: "Keyword parameter is required",
        },
        { status: 400 },
      );
    }

    const queryParams = new URLSearchParams();

    queryParams.append("keyword", params.keyword);

    if (params.page) queryParams.append("page", params.page);
    if (params.sort_field) queryParams.append("sort_field", params.sort_field);
    if (params.sort_type) queryParams.append("sort_type", params.sort_type);
    if (params.sort_lang) queryParams.append("sort_lang", params.sort_lang);
    if (params.category) queryParams.append("category", params.category);
    if (params.country) queryParams.append("country", params.country);
    if (params.year) queryParams.append("year", params.year);
    if (params.limit) queryParams.append("limit", params.limit);

    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_URL
    }/v1/api/tim-kiem?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "NextJS Server",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data: SearchApiResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in search API:", error);

    return NextResponse.json(
      {
        status: false,
        msg: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
