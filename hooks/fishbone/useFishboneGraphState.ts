"use client";

import { useRef, useState } from "react";

import { buildFishboneGraph } from "../../lib/fishbone-graph";
import type { FishboneDocument, FishboneGraph } from "../../lib/fishbone-types";

export function useFishboneGraphState(initialDocument: FishboneDocument) {
  const initialGraphRef = useRef<FishboneGraph | null>(null);

  if (!initialGraphRef.current) {
    initialGraphRef.current = buildFishboneGraph(initialDocument);
  }

  const initialGraph = initialGraphRef.current;
  const [graph, setGraph] = useState<FishboneGraph>(initialGraph);
  const draftRevisionRef = useRef(0);

  function applyGraph(nextGraph: FishboneGraph): void {
    draftRevisionRef.current += 1;
    setGraph(nextGraph);
  }

  return {
    graph,
    initialGraph,
    draftRevisionRef,
    applyGraph,
    replaceGraph: setGraph,
  };
}
