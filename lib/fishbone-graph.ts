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
  const stack = [graph.rootId];

  while (stack.length > 0) {
    const nodeId = stack.pop();

    if (!nodeId) {
      continue;
    }

    const node = graph.nodes[nodeId];

    if (!node) {
      continue;
    }

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
): FishboneGraph {
  const parentNode = graph.nodes[parentId];

  if (!parentNode) {
    return graph;
  }

  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [parentId]: {
        ...parentNode,
        childIds: [...parentNode.childIds, newNode.id],
      },
      [newNode.id]: newNode,
    },
  };
}
