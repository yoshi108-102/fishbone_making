"use client";

import { useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { saveFishboneDocument } from "../../lib/fishbone-api";
import {
  buildFishboneGraph,
  graphToFishboneDocument,
} from "../../lib/fishbone-graph";
import type { FishboneGraph } from "../../lib/fishbone-types";

type UseFishbonePersistenceOptions = {
  initialGraph: FishboneGraph;
  draftRevisionRef: MutableRefObject<number>;
  replaceGraph: (graph: FishboneGraph) => void;
  reconcileSelection: (graph: FishboneGraph) => void;
};

function serializeGraph(graph: FishboneGraph): string {
  return JSON.stringify(graphToFishboneDocument(graph));
}

export function useFishbonePersistence({
  initialGraph,
  draftRevisionRef,
  replaceGraph,
  reconcileSelection,
}: UseFishbonePersistenceOptions) {
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savedGraphRef = useRef(initialGraph);
  const savedSnapshotRef = useRef(serializeGraph(initialGraph));
  const saveRequestIdRef = useRef(0);

  function clearSaveError(): void {
    setSaveError("");
  }

  async function persistGraph(nextGraph: FishboneGraph): Promise<void> {
    const nextSnapshot = serializeGraph(nextGraph);

    if (nextSnapshot === savedSnapshotRef.current) {
      return;
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
        return;
      }

      savedGraphRef.current = savedGraph;
      savedSnapshotRef.current = serializeGraph(savedGraph);

      if (draftRevisionAtSaveStart === draftRevisionRef.current) {
        replaceGraph(savedGraph);
        reconcileSelection(savedGraph);
      }

      setIsSaving(false);
    } catch (error) {
      if (saveId !== saveRequestIdRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "JSONの保存に失敗しました。";

      if (draftRevisionAtSaveStart === draftRevisionRef.current) {
        replaceGraph(rollbackGraph);
        reconcileSelection(rollbackGraph);
      }

      setIsSaving(false);
      setSaveError(message);
    }
  }

  return {
    isSaving,
    saveError,
    clearSaveError,
    persistGraph,
  };
}
