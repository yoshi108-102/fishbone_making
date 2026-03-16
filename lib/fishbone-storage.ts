import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createDefaultFishboneDocument,
  normalizeFishboneDocument,
} from "./fishbone-document";
import type { FishboneDocument } from "./fishbone-types";

const sourceDirectory = path.join(process.cwd(), "source");
const documentPath = path.join(sourceDirectory, "fishbone-data.json");

export type FishboneDocumentStore = {
  read: () => Promise<FishboneDocument>;
  write: (document: unknown) => Promise<FishboneDocument>;
};

export function createFileFishboneDocumentStore(): FishboneDocumentStore {
  async function write(document: unknown): Promise<FishboneDocument> {
    const normalizedDocument = normalizeFishboneDocument(document);

    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(
      documentPath,
      `${JSON.stringify(normalizedDocument, null, 2)}\n`,
      "utf8",
    );

    return normalizedDocument;
  }

  async function read(): Promise<FishboneDocument> {
    try {
      const rawDocument = await readFile(documentPath, "utf8");
      const parsed = JSON.parse(rawDocument) as unknown;
      return normalizeFishboneDocument(parsed);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        const starterDocument = createDefaultFishboneDocument();
        await write(starterDocument);
        return starterDocument;
      }

      throw error;
    }
  }

  return { read, write };
}

const fishboneDocumentStore = createFileFishboneDocumentStore();

export async function readFishboneDocument(): Promise<FishboneDocument> {
  return fishboneDocumentStore.read();
}

export async function writeFishboneDocument(
  document: unknown,
): Promise<FishboneDocument> {
  return fishboneDocumentStore.write(document);
}
