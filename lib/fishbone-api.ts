import type { FishboneDocument } from "./fishbone-types";

export async function saveFishboneDocument(
  document: FishboneDocument,
): Promise<FishboneDocument> {
  const response = await fetch("/api/fishbone", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message || "JSONの保存に失敗しました。");
  }

  return (await response.json()) as FishboneDocument;
}
