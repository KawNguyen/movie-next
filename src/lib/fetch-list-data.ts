import { cache } from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export type SearchParamsInput = {
  [key: string]: string | string[] | undefined;
};

export function buildQuery(sp: SearchParamsInput) {
  const q = new URLSearchParams();
  Object.entries(sp).forEach(([key, value]) => {
    if (typeof value === "string" && value) q.append(key, value);
  });
  return q.toString();
}

// cache() dedupe trong cùng một lần render (generateMetadata + Page)
// Tham số phải là kiểu nguyên thủy (string) thì dedupe mới hoạt động
export const fetchListData = cache(
  async (endpoint: string, slug: string, query: string = "") => {
    try {
      const res = await fetch(
        `${baseUrl}/api/${endpoint}/${slug}${query ? `?${query}` : ""}`,
        { next: { revalidate: 60 } },
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint} data:`, error);
      return null;
    }
  },
);