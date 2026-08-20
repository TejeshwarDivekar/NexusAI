import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.RAILWAY_SERVICE_BACKEND_URL ||
  "https://backend-production-873b.up.railway.app";

function getTargetUrl(pathParts: string[], search: string): string {
  let base = BACKEND_BASE.trim().replace(/\/+$/, "");
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  const subpath = pathParts.join("/");
  return `${base}/api/v1/${subpath}${search}`;
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  try {
    const targetUrl = getTargetUrl(params.path || [], req.nextUrl.search);
    
    // Copy headers from request, omitting host-specific headers
    const forwardHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "connection" && lower !== "content-length") {
        forwardHeaders[key] = value;
      }
    });

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        const bodyBuffer = await req.arrayBuffer();
        if (bodyBuffer.byteLength > 0) {
          fetchOptions.body = bodyBuffer;
        }
      } catch {}
    }

    const backendRes = await fetch(targetUrl, fetchOptions);

    // Read response as arrayBuffer to support both JSON and binary files (.docx)
    const resBuffer = await backendRes.arrayBuffer();

    const responseHeaders: Record<string, string> = {};
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "content-encoding" && lower !== "content-length") {
        responseHeaders[key] = value;
      }
    });

    return new NextResponse(resBuffer, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Backend proxy error", detail: error.message || "Failed to reach backend service" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, { path });
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, { path });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, { path });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handleProxy(req, { path });
}
