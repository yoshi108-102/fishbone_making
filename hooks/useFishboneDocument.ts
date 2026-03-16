"use client";

import { useRef, useState } from "react";

import { saveFishboneDocument } from "../lib/fishbone-api";
import {
  appendChildNode,
  buildFishboneGraph,
  graphToFishboneDocument,
  sanitizeTrail,
  updateNodeFields,
} from "../lib/fishbone-graph";
import type {
  FishboneDocument,
  FishboneEditableField,
  FishboneEditorState,
  FishboneGraph,
  FishboneNodeRecord,
} from "../lib/fishbone-types";

function createNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyEditor(): FishboneEditorState {
  return {
    isOpen: false,
    mode: "create",
    targetNodeId: "root",
    contextLine: "",
    title: "",
    notes: "",
    error: "",
  };
}

function serializeGraph(graph: FishboneGraph): string {
  return JSON.stringify(graphToFishboneDocument(graph));
}

type PersistResult = {
  ok: boolean;
  message: string;
};

export function useFishboneDocument(initialDocument: FishboneDocument) {
  const initialGraphRef = useRef<FishboneGraph | null>(null);

  if (!initialGraphRef.current) {
    initialGraphRef.current = buildFishboneGraph(initialDocument);
  }

  const initialGraph = initialGraphRef.current;
  const [graph, setGraph] = useState<FishboneGraph>(initialGraph);
  const [selectedTrail, setSelectedTrail] = useState<string[]>([initialGraph.rootId]);
  const [editor, setEditor] = useState<FishboneEditorState>(createEmptyEditor);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savedGraphRef = useRef(initialGraph);
  const savedSnapshotRef = useRef(serializeGraph(initialGraph));
  const saveRequestIdRef = useRef(0);
  const draftRevisionRef = useRef(0);

  const selectedNodeId =
    selectedTrail[selectedTrail.length - 1] ?? initialGraph.rootId;
  const selectedNode = graph.nodes[selectedNodeId] ?? graph.nodes[graph.rootId];
  const children = selectedNode.childIds
    .map((childId) => graph.nodes[childId])
    .filter((node): node is FishboneNodeRecord => Boolean(node));
  const currentDepth = Math.max(selectedTrail.length - 1, 0);

  function applyGraph(nextGraph: FishboneGraph): void {
    draftRevisionRef.current += 1;
    setGraph(nextGraph);
  }

  async function persistGraph(nextGraph: FishboneGraph): Promise<PersistResult> {
    const nextSnapshot = serializeGraph(nextGraph);

    if (nextSnapshot === savedSnapshotRef.current) {
      return { ok: true, message: "" };
    }

    const saveId = saveRequestIdRef.current + 1;
    const draftRevisionAtSaveStart = draftRevisionRef.current;
    const rollbackGraph = savedGraphRef.current;

    saveRequestIdRef.current = saveId;
    setIsSaving(true);
    setSaveError("");

    try {
      const savedDocument = await saveFishboneDocument(
        graphToFishboneDocument(nextGraph),
      );
      const savedGraph = buildFishboneGraph(savedDocument);

      if (saveId !== saveRequestIdRef.current) {
        return { ok: true, message: "" };
      }

      savedGraphRef.current = savedGraph;
      savedSnapshotRef.current = serializeGraph(savedGraph);

      if (draftRevisionAtSaveStart === draftRevisionRef.current) {
        setGraph(savedGraph);
        setSelectedTrail((currentTrail) => sanitizeTrail(savedGraph, currentTrail));
      }

      setIsSaving(false);
      return { ok: true, message: "" };
    } catch (error) {
      if (saveId !== saveRequestIdRef.current) {
        return { ok: false, message: "" };
      }

      const message =
        error instanceof Error ? error.message : "JSONの保存に失敗しました。";

      if (draftRevisionAtSaveStart === draftRevisionRef.current) {
        setGraph(rollbackGraph);
        setSelectedTrail((currentTrail) =>
          sanitizeTrail(rollbackGraph, currentTrail),
        );
      }

      setIsSaving(false);
      setSaveError(message);
      return { ok: false, message };
    }
  }

  function updateSelectedField(field: FishboneEditableField, value: string): void {
    const nextGraph = updateNodeFields(graph, selectedNode.id, {
      [field]: value,
    });

    if (nextGraph === graph) {
      return;
    }

    setSaveError("");
    applyGraph(nextGraph);
  }

  async function commitSelectedNode(): Promise<void> {
    await persistGraph(graph);
  }

  function selectChild(nodeId: string): void {
    if (!selectedNode.childIds.includes(nodeId)) {
      return;
    }

    setSelectedTrail([...selectedTrail, nodeId]);
  }

  function goToParent(): void {
    if (selectedTrail.length <= 1) {
      return;
    }

    setSelectedTrail(selectedTrail.slice(0, -1));
  }

  function goToTop(): void {
    setSelectedTrail([graph.rootId]);
  }

  function openCreateEditor(): void {
    setEditor({
      isOpen: true,
      mode: "create",
      targetNodeId: selectedNode.id,
      contextLine: `追加先: ${selectedNode.title || "最上位の課題"}`,
      title: "",
      notes: "",
      error: "",
    });
  }

  function openEditEditor(node: FishboneNodeRecord): void {
    setEditor({
      isOpen: true,
      mode: "edit",
      targetNodeId: node.id,
      contextLine: `編集対象: ${node.title || "無題の要素"}`,
      title: node.title,
      notes: node.notes,
      error: "",
    });
  }

  function closeEditor(): void {
    setEditor(createEmptyEditor());
  }

  function updateEditorField(field: FishboneEditableField, value: string): void {
    setEditor((currentEditor) => ({
      ...currentEditor,
      [field]: value,
      error: "",
    }));
  }

  async function submitEditor(): Promise<void> {
    const title = editor.title.trim();

    if (!title) {
      setEditor((currentEditor) => ({
        ...currentEditor,
        error: "タイトルは必須です。",
      }));
      return;
    }

    let nextGraph = graph;

    if (editor.mode === "create") {
      nextGraph = appendChildNode(graph, editor.targetNodeId, {
        id: createNodeId(),
        title,
        notes: editor.notes.trim(),
        parentId: editor.targetNodeId,
        childIds: [],
      });
    } else {
      nextGraph = updateNodeFields(graph, editor.targetNodeId, {
        title,
        notes: editor.notes.trim(),
      });
    }

    if (nextGraph === graph) {
      closeEditor();
      return;
    }

    setSaveError("");
    applyGraph(nextGraph);
    closeEditor();
    await persistGraph(nextGraph);
  }

  return {
    selectedNode,
    children,
    currentDepth,
    canGoUp: currentDepth > 0,
    editor,
    isSaving,
    saveError,
    updateSelectedField,
    commitSelectedNode,
    selectChild,
    goToParent,
    goToTop,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    updateEditorField,
    submitEditor,
  };
}
