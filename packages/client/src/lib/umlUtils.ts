import { UMLNode, UMLEdge } from "@/app/types/uml";

/**
 * Saves the diagram state (nodes and edges) into a structured, serialized JSON string.
 */
export function saveDiagramState(nodes: UMLNode[], edges: UMLEdge[]): string {
  const cleanNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      name: node.data.name,
      isAbstract: node.data.isAbstract || false,
      isInterface: node.data.isInterface || false,
      attributes: node.data.attributes?.map((attr) => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        access: attr.access,
      })) || [],
      methods: node.data.methods?.map((m) => ({
        id: m.id,
        name: m.name,
        returnType: m.returnType,
        access: m.access,
      })) || [],
    },
  }));

  const cleanEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: {
      type: edge.data?.type || "association",
      label: edge.data?.label || "",
    },
  }));

  return JSON.stringify(
    {
      version: "1.0",
      timestamp: new Date().toISOString(),
      nodes: cleanNodes,
      edges: cleanEdges,
    },
    null,
    2
  );
}

/**
 * Parses a serialized JSON state back into nodes and edges for React Flow.
 */
export function loadDiagramState(jsonString: string): { nodes: UMLNode[]; edges: UMLEdge[] } {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
    };
  } catch (error) {
    console.error("Failed to parse diagram state JSON", error);
    return { nodes: [], edges: [] };
  }
}


