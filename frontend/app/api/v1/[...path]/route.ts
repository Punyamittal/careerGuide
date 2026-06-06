import { NextRequest, NextResponse } from "next/server";

function getBackendOrigin(): string {
  const origin =
    process.env.BACKEND_ORIGIN?.trim() ||
    process.env.BACKEND_INTERNAL_URL?.trim() ||
    "http://127.0.0.1:5000";
  return origin.replace(/\/$/, "");
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const backend = getBackendOrigin();
  const subpath = pathSegments.map(encodeURIComponent).join("/");
  const target = `${backend}/api/v1/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
      cache: "no-store"
    });

    const responseHeaders = new Headers();
    const resType = res.headers.get("content-type");
    if (resType) responseHeaders.set("content-type", resType);

    return new NextResponse(await res.arrayBuffer(), {
      status: res.status,
      headers: responseHeaders
    });
  } catch (cause) {
    const hint =
      cause instanceof Error ? cause.message : "connection failed";
    console.error("[api/v1 proxy]", target, hint);

    return NextResponse.json(
      {
        success: false,
        error: `Backend unreachable (${backend}). ${hint}. Set BACKEND_ORIGIN in Netlify to your deployed API URL, or run the backend locally (port 5000).`,
        data: null
      },
      { status: 502 }
    );
  }
}

type RouteCtx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
