import { NextResponse } from "next/server";

import {
  readFishboneDocument,
  writeFishboneDocument,
} from "../../../lib/fishbone-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const document = await readFishboneDocument();
  return NextResponse.json(document);
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const document = await writeFishboneDocument(payload);
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "保存処理に失敗しました。",
      },
      { status: 400 },
    );
  }
}
