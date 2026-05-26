/**
 * app/api/predict/route.ts
 *
 * Proxies prediction requests from the browser to the Python FastAPI server.
 * Keeps the Python server URL out of the browser and avoids CORS issues.
 */

import { NextRequest, NextResponse } from "next/server";

const PYTHON_API = process.env.PYTHON_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${PYTHON_API}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      // Abort if Python server doesn't respond within 10 s
      signal:  AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return NextResponse.json(
        { error: "Model server returned an error.", detail },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Model server timed out."
        : "Could not reach the model server. Is python/server.py running?";

    console.error("[/api/predict]", err);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Health-check passthrough — useful for monitoring */
export async function GET() {
  try {
    const res  = await fetch(`${PYTHON_API}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Model server unreachable." },
      { status: 503 }
    );
  }
}
