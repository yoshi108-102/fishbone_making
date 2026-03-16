"use client";

import { useState } from "react";

import { sanitizeTrail } from "../../lib/fishbone-graph";
import type { FishboneGraph, FishboneNodeRecord } from "../../lib/fishbone-types";

export function useFishboneSelection(graph: FishboneGraph) {
  const [selectedTrail, setSelectedTrail] = useState<string[]>([graph.rootId]);
  const selectedNodeId = selectedTrail[selectedTrail.length - 1] ?? graph.rootId;
  const selectedNode = graph.nodes[selectedNodeId] ?? graph.nodes[graph.rootId];
  const children = selectedNode.childIds
    .map((childId) => graph.nodes[childId])
    .filter((node): node is FishboneNodeRecord => Boolean(node));
  const currentDepth = Math.max(selectedTrail.length - 1, 0);

  function selectChild(nodeId: string): void {
    if (!selectedNode.childIds.includes(nodeId)) {
      return;
    }

    setSelectedTrail((currentTrail) => [...currentTrail, nodeId]);
  }

  function goToParent(): void {
    setSelectedTrail((currentTrail) =>
      currentTrail.length <= 1 ? currentTrail : currentTrail.slice(0, -1),
    );
  }

  function goToTop(): void {
    setSelectedTrail([graph.rootId]);
  }

  function reconcileSelection(nextGraph: FishboneGraph): void {
    setSelectedTrail((currentTrail) => sanitizeTrail(nextGraph, currentTrail));
  }

  return {
    selectedNodeId,
    selectedNode,
    children,
    currentDepth,
    canGoUp: currentDepth > 0,
    selectChild,
    goToParent,
    goToTop,
    reconcileSelection,
  };
}
