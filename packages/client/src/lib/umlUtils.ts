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

export interface LogicRulesOutput {
  schema: {
    classes: Array<{
      name: string;
      kind: "class" | "abstract class" | "interface";
      attributes: Array<{ name: string; type: string; visibility: string }>;
      methods: Array<{ name: string; returnType: string; visibility: string }>;
    }>;
    relationships: Array<{
      fromClass: string;
      toClass: string;
      relationType: "inheritance" | "interface" | "association";
    }>;
  };
  rules: string[];
  rulesText: string;
}

/**
 * Transforms the diagram state (nodes and edges) into structured AST validation rules (logic facts).
 * These rules can be consumed by code-grading engines or static analyzers to verify Java/OOP source code structures.
 */
export function transformToLogicRules(nodes: UMLNode[], edges: UMLEdge[]): LogicRulesOutput {
  const rules: string[] = [];

  // 1. Create mapping from Node ID to Class Name for relationship resolution
  const nodeMap = new Map<string, { name: string; kind: string }>();
  
  const classes = nodes.map((node) => {
    const { name, isAbstract, isInterface, attributes = [], methods = [] } = node.data;
    const kind = isInterface ? "interface" : isAbstract ? "abstract class" : "class";
    
    nodeMap.set(node.id, { name, kind });

    // Format visibility modifier to readable keyword
    const getVisibilityName = (access: string) => {
      switch (access) {
        case "+": return "public";
        case "-": return "private";
        case "#": return "protected";
        default: return "public";
      }
    };

    const cleanAttributes = attributes.map((attr) => ({
      name: attr.name,
      type: attr.type,
      visibility: getVisibilityName(attr.access),
    }));

    const cleanMethods = methods.map((m) => ({
      name: m.name,
      returnType: m.returnType,
      visibility: getVisibilityName(m.access),
    }));

    return {
      name,
      kind: kind as "class" | "abstract class" | "interface",
      attributes: cleanAttributes,
      methods: cleanMethods,
    };
  });

  // 2. Generate Logic Rules for Classes, Attributes, and Methods
  classes.forEach((cls) => {
    const safeName = cls.name.replace(/[^a-zA-Z0-9_]/g, ""); // Ensure safe characters for fact representations
    
    // Define Class Type rule
    if (cls.kind === "interface") {
      rules.push(`interface(${safeName}).`);
    } else if (cls.kind === "abstract class") {
      rules.push(`abstract_class(${safeName}).`);
    } else {
      rules.push(`class(${safeName}).`);
    }

    // Define Attributes rules: attribute(Class, Name, Type, Visibility)
    cls.attributes.forEach((attr) => {
      const safeAttrName = attr.name.replace(/[^a-zA-Z0-9_]/g, "");
      const safeAttrType = attr.type.replace(/[^a-zA-Z0-9_]/g, "");
      rules.push(`attribute(${safeName}, ${safeAttrName}, ${safeAttrType}, ${attr.visibility}).`);
    });

    // Define Methods rules: method(Class, Name, ReturnType, Visibility)
    cls.methods.forEach((m) => {
      const safeMethodName = m.name.replace(/[^a-zA-Z0-9_]/g, "");
      const safeReturnType = m.returnType.replace(/[^a-zA-Z0-9_]/g, "");
      rules.push(`method(${safeName}, ${safeMethodName}, ${safeReturnType}, ${m.visibility}).`);
    });
  });

  // 3. Process relationships and map using Class Names
  const relationships: Array<{
    fromClass: string;
    toClass: string;
    relationType: "inheritance" | "interface" | "association";
  }> = [];

  edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const relType = edge.data?.type || "association";

    if (sourceNode && targetNode) {
      const safeSource = sourceNode.name.replace(/[^a-zA-Z0-9_]/g, "");
      const safeTarget = targetNode.name.replace(/[^a-zA-Z0-9_]/g, "");

      relationships.push({
        fromClass: sourceNode.name,
        toClass: targetNode.name,
        relationType: relType as "inheritance" | "interface" | "association",
      });

      // Generate hierarchy & connection rules
      if (relType === "inheritance") {
        rules.push(`extends(${safeSource}, ${safeTarget}).`);
      } else if (relType === "interface") {
        rules.push(`implements(${safeSource}, ${safeTarget}).`);
      } else {
        rules.push(`associates(${safeSource}, ${safeTarget}).`);
      }
    }
  });

  return {
    schema: {
      classes,
      relationships,
    },
    rules,
    rulesText: rules.join("\n"),
  };
}
