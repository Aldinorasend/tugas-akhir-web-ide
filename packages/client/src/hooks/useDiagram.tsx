import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "reactflow";
import { useCallback, useState, useEffect, useRef } from "react";
import { UMLClassData, UMLNode, UMLEdge, RelationType, UMLRelationData } from "@/app/types/uml";
import { generateId } from "@/app/utils/id";

export function useDiagram() {
  const [nodes, setNodes, onNodesChangeState] = useNodesState<UMLClassData>([]);
  const [edges, setEdges, onEdgesChangeState] = useEdgesState<UMLRelationData>([]);
  const [selectedRelation, setSelectedRelation] = useState<RelationType>("inheritance");

  // ==========================================
  // 1. STATE & REF FOR LEARNING ANALYTICS
  // ==========================================
  const [diagramMetrics, setDiagramMetrics] = useState({
    temporal: {
      time_spent_ms: 0,
      idle_time_ms: 0,
      max_single_idle_ms: 0,
    },
    spatial_churn: {
      total_actions: 0,
      node_add_count: 0,
      node_delete_count: 0,
      edge_add_count: 0,
      edge_delete_count: 0,
      component_modification_count: 0,
    },
    evaluation: {
      submit_count: 0,
      mismatch_attempts: 0,
    }
  });

  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const currentIdleRef = useRef<number>(0);
  const maxIdleRef = useRef<number>(0);
  const accumulatedIdleRef = useRef<number>(0);

  // Background Timer (Berjalan setiap 1 detik)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const totalTimeSpent = now - startTimeRef.current;
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Threshold: Jika pasif >= 5 detik, mulai hitung sebagai IDLE
      if (timeSinceLastActivity >= 5000) {
        currentIdleRef.current = timeSinceLastActivity;
        if (currentIdleRef.current > maxIdleRef.current) {
          maxIdleRef.current = currentIdleRef.current;
        }
      }

      setDiagramMetrics((prev) => ({
        ...prev,
        temporal: {
          time_spent_ms: totalTimeSpent,
          idle_time_ms: accumulatedIdleRef.current + currentIdleRef.current,
          max_single_idle_ms: maxIdleRef.current,
        }
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper untuk mereset timer idle setiap kali user beraksi
  const logActivity = useCallback(() => {
    if (currentIdleRef.current > 0) {
      accumulatedIdleRef.current += currentIdleRef.current;
      currentIdleRef.current = 0;
    }
    lastActivityRef.current = Date.now();
  }, []);

  // Helper untuk menambahkan counter aksi ke state churn
  const trackAction = useCallback((actionType: keyof typeof diagramMetrics.spatial_churn) => {
    logActivity();
    setDiagramMetrics((prev) => {
      const updatedChurn = { ...prev.spatial_churn };
      updatedChurn.total_actions += 1;
      if (actionType in updatedChurn) {
        (updatedChurn[actionType] as number) += 1;
      }
      return { ...prev, spatial_churn: updatedChurn };
    });
  }, [logActivity]);


  // ==========================================
  // 2. INTERCEPTOR ACTIONS (REACT FLOW EVENTS)
  // ==========================================

  // Deteksi Hapus Node/Edge lewat tombol keyboard 'Delete' bawaan React Flow
  const onNodesChange = useCallback((changes: any) => {
    onNodesChangeState(changes);
    changes.forEach((change: any) => {
      if (change.type === "remove") trackAction("node_delete_count");
    });
  }, [onNodesChangeState, trackAction]);

  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeState(changes);
    changes.forEach((change: any) => {
      if (change.type === "remove") trackAction("edge_delete_count");
    });
  }, [onEdgesChangeState, trackAction]);

  // Deteksi Tambah Node (Class)
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
    trackAction("node_add_count");
  }, [setNodes, trackAction]);

  // Deteksi Hapus Node via klik tombol delete custom UI
  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    trackAction("node_delete_count");
  }, [setNodes, setEdges, trackAction]);

  // Deteksi Hubungkan Edge (Relasi)
  const onConnect = useCallback((params: Connection) => {
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
    trackAction("edge_add_count");
  },
    [setEdges, selectedRelation, trackAction]
  );

  // Deteksi Edit Isi Atribut / Method / Nama Kelas
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
    trackAction("component_modification_count");
  }, [setNodes, trackAction]);

  // Deteksi Ubah Jenis Relasi
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
    trackAction("component_modification_count");
  }, [setEdges, trackAction]);

  // Fungsi luar untuk memicu log submission (Ditekan pas klik submit diagram)
  const trackEvaluationSubmit = useCallback((isPassed: boolean) => {
    logActivity();
    setDiagramMetrics((prev) => ({
      ...prev,
      evaluation: {
        submit_count: prev.evaluation.submit_count + 1,
        mismatch_attempts: isPassed ? prev.evaluation.mismatch_attempts : prev.evaluation.mismatch_attempts + 1,
      }
    }));
  }, [logActivity]);

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
    setSelectedRelation,
    // Ekspos metrik analitik & tracker agar bisa ditarik oleh Workspace utama
    diagramMetrics,
    trackEvaluationSubmit
  };
}