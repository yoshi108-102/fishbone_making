import type {
  FishboneDocument,
  FishboneEditableField,
  FishboneGraph,
  FishboneNodeRecord,
  FishbonePath,
} from "./fishbone-types";

export function buildFishboneGraph(document: FishboneDocument): FishboneGraph {
  const nodes: Record<string, FishboneNodeRecord> = {};
  const rootItem =
    document.items.find((item) => item.id === document.rootId) ?? {
      id: document.rootId,
      parentId: null,
      title: "",
      notes: "",
    };

  document.items.forEach((item) => {
    nodes[item.id] = {
      id: item.id,
      title: item.title,
      notes: item.notes,
      parentId: item.parentId,
      childIds: [],
    };
  });

  if (!nodes[rootItem.id]) {
    nodes[rootItem.id] = {
      id: rootItem.id,
      title: rootItem.title,
      notes: rootItem.notes,
      parentId: null,
      childIds: [],
    };
  }

  document.items.forEach((item) => {
    if (!item.parentId) {
      return;
    }

    const parentNode = nodes[item.parentId];

    if (parentNode) {
      parentNode.childIds.push(item.id);
    }
  });

  return {
    rootId: rootItem.id,
    nodes,
  };
}

export function graphToFishboneDocument(graph: FishboneGraph): FishboneDocument {
  const items: FishboneDocument["items"] = [];
  const visited = new Set<string>();

  function pushSubtree(startNodeId: string): void {
    const stack = [startNodeId];

    while (stack.length > 0) {
      const nodeId = stack.pop();

      if (!nodeId || visited.has(nodeId)) {
        continue;
      }

      const node = graph.nodes[nodeId];

      if (!node) {
        continue;
      }

      visited.add(nodeId);
      items.push({
        id: node.id,
        parentId: node.parentId,
        title: node.title,
        notes: node.notes,
      });

      for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
        stack.push(node.childIds[index]);
      }
    }
  }

  pushSubtree(graph.rootId);

  Object.keys(graph.nodes).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      pushSubtree(nodeId);
    }
  });

  return {
    rootId: graph.rootId,
    items,
  };
}

export function sanitizeTrail(
  graph: FishboneGraph,
  trail: FishbonePath,
): FishbonePath {
  const nextTrail: FishbonePath = [graph.rootId];
  const candidateTrail =
    Array.isArray(trail) && trail[0] === graph.rootId ? trail.slice(1) : [];
  let currentId = graph.rootId;

  for (const nodeId of candidateTrail) {
    const currentNode = graph.nodes[currentId];

    if (!currentNode || !currentNode.childIds.includes(nodeId)) {
      break;
    }

    nextTrail.push(nodeId);
    currentId = nodeId;
  }

  return nextTrail;
}

export function updateNodeFields(
  graph: FishboneGraph,
  nodeId: string,
  fields: Partial<Record<FishboneEditableField, string>>,
): FishboneGraph {
  const node = graph.nodes[nodeId];

  if (!node) {
    return graph;
  }

  const nextTitle = fields.title ?? node.title;
  const nextNotes = fields.notes ?? node.notes;

  if (nextTitle === node.title && nextNotes === node.notes) {
    return graph;
  }

  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [nodeId]: {
        ...node,
        title: nextTitle,
        notes: nextNotes,
      },
    },
  };
}

export function appendChildNode(
  graph: FishboneGraph,
  parentId: string,
  newNode: FishboneNodeRecord,
  attachedUndefinedNodeIds: string[] = [],
): FishboneGraph {
  const parentNode = graph.nodes[parentId];

  if (!parentNode) {
    return graph;
  }

  const attachableChildIds = attachedUndefinedNodeIds.filter((childId) => {
    const childNode = graph.nodes[childId];
    return Boolean(childNode && childNode.parentId === null && childId !== graph.rootId);
  });
  const attachableChildIdSet = new Set(attachableChildIds);
  const nextNodes: FishboneGraph["nodes"] = {
    ...graph.nodes,
    [parentId]: {
      ...parentNode,
      childIds: [...parentNode.childIds, newNode.id],
    },
    [newNode.id]: {
      ...newNode,
      childIds: attachableChildIds,
    },
  };

  attachableChildIds.forEach((childId) => {
    const childNode = graph.nodes[childId];

    if (!childNode || !attachableChildIdSet.has(childId)) {
      return;
    }

    nextNodes[childId] = {
      ...childNode,
      parentId: newNode.id,
    };
  });

  return {
    ...graph,
    nodes: nextNodes,
  };
}

export function removeNode(graph: FishboneGraph, nodeId: string): FishboneGraph {
  const node = graph.nodes[nodeId];

  if (!node || nodeId === graph.rootId) {
    return graph;
  }

  const nextNodes: FishboneGraph["nodes"] = { ...graph.nodes };

  if (node.parentId) {
    const parentNode = graph.nodes[node.parentId];

    if (parentNode) {
      nextNodes[node.parentId] = {
        ...parentNode,
        childIds: parentNode.childIds.filter((childId) => childId !== nodeId),
      };
    }
  }

  if (node.childIds.length > 0) {
    node.childIds.forEach((childId) => {
      const childNode = graph.nodes[childId];

      if (!childNode) {
        return;
      }

      nextNodes[childId] = {
        ...childNode,
        parentId: null,
      };
    });
  }

  delete nextNodes[nodeId];

  return {
    ...graph,
    nodes: nextNodes,
  };
}

export function listUndefinedParentNodes(graph: FishboneGraph): FishboneNodeRecord[] {
  return Object.values(graph.nodes).filter(
    (node) => node.id !== graph.rootId && node.parentId === null,
  );
}
