import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { hasAllowedOrigin } from "@/lib/request-guard";

const BACKEND_URL = process.env.BACKEND_URL || "https://api-bingewise.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // CSRF defense-in-depth on state-changing methods.
  if (method !== "GET" && !hasAllowedOrigin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const path = params.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // Forward the real client IP so the backend's per-IP rate limiter buckets
  // each website user individually instead of sharing one server-IP bucket.
  const clientIp =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");
  if (clientIp) {
    headers["X-Forwarded-For"] = clientIp;
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  let body: string | undefined;
  if (method !== "GET") {
    body = await request.text();
    if (!body) body = undefined;
  }

  const res = await fetch(url, { method, headers, body });

  if (res.status === 401) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return new NextResponse(null, { status: res.status });
  }

  const contentTypeHeader = res.headers.get("content-type") || "";
  if (!contentTypeHeader.includes("application/json")) {
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": contentTypeHeader || "text/plain" },
    });
  }

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
