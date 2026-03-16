"use client";

import { updateNodeFields } from "../../lib/fishbone-graph";
import type {
  FishboneEditableField,
  FishboneGraph,
} from "../../lib/fishbone-types";

type UseFishboneSelectedNodeOptions = {
  graph: FishboneGraph;
  selectedNodeId: string;
  applyGraph: (graph: FishboneGraph) => void;
  persistGraph: (graph: FishboneGraph) => Promise<void>;
  clearSaveError: () => void;
};

export function useFishboneSelectedNode({
  graph,
  selectedNodeId,
  applyGraph,
  persistGraph,
  clearSaveError,
}: UseFishboneSelectedNodeOptions) {
  function updateSelectedField(
    field: FishboneEditableField,
    value: string,
  ): void {
    const nextGraph = updateNodeFields(graph, selectedNodeId, {
      [field]: value,
    });

    if (nextGraph === graph) {
      return;
    }

    clearSaveError();
    applyGraph(nextGraph);
  }

  async function commitSelectedNode(): Promise<void> {
    await persistGraph(graph);
  }

  return {
    updateSelectedField,
    commitSelectedNode,
  };
}
