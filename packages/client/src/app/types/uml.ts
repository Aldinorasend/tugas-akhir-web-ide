import { Node, Edge } from "reactflow";

export type AccessModifier = "+" | "-" | "#";

export type Attribute = {
  id: string;
  name: string;
  type: string;
  access: AccessModifier;
};

export type Method = {
  id: string;
  name: string;
  returnType: string;
  access: AccessModifier;
};

export type UMLClassData = {
  name: string;
  isAbstract?: boolean;
  isInterface?: boolean;
  attributes: Attribute[];
  methods: Method[];

  // Callback handlers for internal node interactions
  readOnly?: boolean;
  onUpdate?: (id: string, data: Partial<UMLClassData>) => void;
  onDelete?: (id: string) => void;
};

export type UMLNode = Node<UMLClassData>;

export type RelationType =
  | "inheritance"
  | "interface";

export interface UMLRelationData {
  type: RelationType;
  label?: string;
}

export type UMLEdge = Edge<UMLRelationData>;

export interface ClassDiagram {
  studyCaseId: string;
  nodes: UMLNode[];
  edges: UMLEdge[];
}

export interface StudyCase {
  id: string;
  title: string;
  description: string;
  answerKey: ClassDiagram;
  createdAt: string;
}
