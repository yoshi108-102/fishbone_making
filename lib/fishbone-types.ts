export type FishbonePath = string[];

export type FishboneItem = {
  id: string;
  parentId: string | null;
  title: string;
  notes: string;
};

export type FishboneDocument = {
  rootId: string;
  items: FishboneItem[];
};

export type FishboneNodeRecord = {
  id: string;
  title: string;
  notes: string;
  parentId: string | null;
  childIds: string[];
};

export type FishboneGraph = {
  rootId: string;
  nodes: Record<string, FishboneNodeRecord>;
};

export type FishboneEditableField = "title" | "notes";

export type FishboneEditorMode = "create" | "edit";

export type FishboneEditorState = {
  isOpen: boolean;
  mode: FishboneEditorMode;
  targetNodeId: string;
  contextLine: string;
  title: string;
  notes: string;
  attachedUndefinedNodeIds: string[];
  error: string;
};
