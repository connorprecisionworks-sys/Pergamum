import { NextResponse } from "next/server";

// Deprecated. Superseded by /api/build/converse, which handles refining a
// generated prompt as part of the conversation. Safe to delete this file
// the next time someone is in here cleaning up.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been replaced by /api/build/converse." },
    { status: 410 }
  );
}
