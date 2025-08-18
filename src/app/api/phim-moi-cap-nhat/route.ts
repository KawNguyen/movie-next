import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";

    const response = await axios.get(
      `${API_URL}/danh-sach/phim-moi-cap-nhat-v3?page=${page}`,
    );
    return Response.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
