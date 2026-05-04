import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "reactflow";
import { useCallback, useState } from "react";
import { UMLClassData, UMLNode, UMLEdge, RelationType, UMLRelationData } from "@/app/types/uml";
import { generateId } from "@/app/utils/id";

export function useDiagram() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<UMLClassData>([]);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState<UMLRelationData>([]);

  const [selectedRelation, setSelectedRelation] = useState<RelationType>("inheritance");

  const onUpdateNode = useCallback((id: string, updates: Partial<UMLClassData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge: UMLEdge = {
        ...params,
        id: generateId(),
        type: "customEdge",
        data: {
          type: selectedRelation,
          label: `«${selectedRelation}»`,
        },
      } as UMLEdge;
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, selectedRelation]
  );

  const addClass = useCallback(() => {
    const newNode: UMLNode = {
      id: generateId(),
      type: "classNode",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        name: "NewClass",
        attributes: [],
        methods: [],
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const updateEdgeType = useCallback((edgeId: string, type: RelationType) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              type,
              label: `«${type}»`,
            },
          };
        }
        return edge;
      })
    );
  }, [setEdges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    onUpdateNode,
    onDeleteNode,
    addClass,
    updateEdgeType,
    selectedRelation,
    setSelectedRelation
  };
}

