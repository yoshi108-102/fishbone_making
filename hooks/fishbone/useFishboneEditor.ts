"use client";

import { useState } from "react";

import type {
  FishboneEditableField,
  FishboneEditorState,
  FishboneNodeRecord,
} from "../../lib/fishbone-types";

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

export function useFishboneEditor() {
  const [editor, setEditor] = useState<FishboneEditorState>(createEmptyEditor);

  function openCreateEditor(node: FishboneNodeRecord): void {
    setEditor({
      isOpen: true,
      mode: "create",
      targetNodeId: node.id,
      contextLine: `追加先: ${node.title || "最上位の課題"}`,
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

  function setEditorError(error: string): void {
    setEditor((currentEditor) => ({
      ...currentEditor,
      error,
    }));
  }

  return {
    editor,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    updateEditorField,
    setEditorError,
  };
}
