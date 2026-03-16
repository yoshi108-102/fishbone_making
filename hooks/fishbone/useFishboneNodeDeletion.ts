"use client";

import { removeNode } from "../../lib/fishbone-graph";
import type { FishboneGraph } from "../../lib/fishbone-types";

type UseFishboneNodeDeletionOptions = {
  graph: FishboneGraph;
  applyGraph: (graph: FishboneGraph) => void;
  persistGraph: (graph: FishboneGraph) => Promise<void>;
  clearSaveError: () => void;
  reconcileSelection: (graph: FishboneGraph) => void;
};

export function useFishboneNodeDeletion({
  graph,
  applyGraph,
  persistGraph,
  clearSaveError,
  reconcileSelection,
}: UseFishboneNodeDeletionOptions) {
  async function deleteNode(nodeId: string): Promise<void> {
    const nextGraph = removeNode(graph, nodeId);

    if (nextGraph === graph) {
      return;
    }

    clearSaveError();
    applyGraph(nextGraph);
    reconcileSelection(nextGraph);
    await persistGraph(nextGraph);
  }

  return {
    deleteNode,
  };
}
