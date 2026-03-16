import type { FishboneDocument, FishboneItem } from "./fishbone-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createStarterCards(): FishboneItem[] {
  return [
    {
      id: "current-state",
      parentId: "root",
      title: "現状",
      notes: "いま何が起きているか。頻度、場所、影響の出方などを分解します。",
    },
    {
      id: "desired-state",
      parentId: "root",
      title: "理想状態",
      notes: "本来どうなっていてほしいか。基準や期待値を書きます。",
    },
    {
      id: "gap",
      parentId: "root",
      title: "ギャップ",
      notes: "現状と理想の差分を観察単位で分けます。",
    },
    {
      id: "point-of-cause",
      parentId: "root",
      title: "発生点候補",
      notes: "どこから why を始めると良いかの候補を置きます。",
    },
  ];
}

function createNormalizedItem(source: unknown, fallbackId: string): FishboneItem {
  const safeSource = isRecord(source) ? source : {};
  const id =
    typeof safeSource.id === "string" && safeSource.id.trim()
      ? safeSource.id
      : fallbackId;

  return {
    id,
    parentId:
      typeof safeSource.parentId === "string" && safeSource.parentId.trim()
        ? safeSource.parentId
        : null,
    title: typeof safeSource.title === "string" ? safeSource.title : "",
    notes: typeof safeSource.notes === "string" ? safeSource.notes : "",
  };
}

export function createDefaultFishboneDocument(): FishboneDocument {
  return {
    rootId: "root",
    items: [
      {
        id: "root",
        parentId: null,
        title: "",
        notes: "",
      },
      ...createStarterCards(),
    ],
  };
}

export function normalizeFishboneDocument(document: unknown): FishboneDocument {
  const safeDocument = isRecord(document) ? document : {};
  const rootId =
    typeof safeDocument.rootId === "string" && safeDocument.rootId.trim()
      ? safeDocument.rootId
      : "root";
  const itemSources = Array.isArray(safeDocument.items) ? safeDocument.items : [];
  const items = itemSources.map((itemSource, index) =>
    createNormalizedItem(itemSource, `${rootId}-${index + 1}`),
  );

  if (!items.some((item) => item.id === rootId)) {
    items.unshift({
      id: rootId,
      parentId: null,
      title: "",
      notes: "",
    });
  }

  return { rootId, items };
}
