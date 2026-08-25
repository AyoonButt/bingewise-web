import { NextRequest, NextResponse } from "next/server";

const TEXT_FIELDS = new Set([
  "title",
  "name",
  "original_title",
  "original_name",
  "overview",
  "biography",
  "character",
  "known_for_department",
  "tagline",
]);

function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp|#39);/g,
      (_, entity) =>
        ({
          amp: "&",
          lt: "<",
          gt: ">",
          quot: '"',
          apos: "'",
          nbsp: " ",
          "#39": "'",
        } as Record<string, string>)[entity]
    );
}

function decodeNode(node: unknown): unknown {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(decodeNode);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] =
        typeof value === "string" && TEXT_FIELDS.has(key)
          ? decodeEntities(value)
          : decodeNode(value);
    }
    return out;
  }
  return node;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const tmdbPath = path.join("/");

  const url = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);
  for (const [key, value] of request.nextUrl.searchParams) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", process.env.TMDB_API_KEY || "");

  const res = await fetch(url.toString());

  if (!res.ok) {
    return NextResponse.json({ message: "TMDB error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(decodeNode(data));
}
