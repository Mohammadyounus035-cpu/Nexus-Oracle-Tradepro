import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";
  const vercelEnv = process.env.VERCEL_ENV ?? "unknown";

  return NextResponse.json(
    {
      commit,
      vercelEnv,
      timestamp: new Date().toISOString()
    },
    {
      headers: {
        "x-commit": commit
      }
    }
  );
}
