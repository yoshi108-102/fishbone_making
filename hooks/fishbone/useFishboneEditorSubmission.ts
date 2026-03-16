"use client";

import { appendChildNode, updateNodeFields } from "../../lib/fishbone-graph";
import type {
  FishboneEditorState,
  FishboneGraph,
} from "../../lib/fishbone-types";

function createNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type UseFishboneEditorSubmissionOptions = {
  graph: FishboneGraph;
  editor: FishboneEditorState;
  applyGraph: (graph: FishboneGraph) => void;
  persistGraph: (graph: FishboneGraph) => Promise<void>;
  clearSaveError: () => void;
  closeEditor: () => void;
  setEditorError: (error: string) => void;
};

export function useFishboneEditorSubmission({
  graph,
  editor,
  applyGraph,
  persistGraph,
  clearSaveError,
  closeEditor,
  setEditorError,
}: UseFishboneEditorSubmissionOptions) {
  async function submitEditor(): Promise<void> {
    const title = editor.title.trim();

    if (!title) {
      setEditorError("タイトルは必須です。");
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
      }, editor.attachedUndefinedNodeIds);
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

    clearSaveError();
    applyGraph(nextGraph);
    closeEditor();
    await persistGraph(nextGraph);
  }

  return {
    submitEditor,
  };
}
