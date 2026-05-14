"use client";

import { useDiagram } from "@/hooks/useDiagram";
import ReactFlow, { Background, Controls, ReactFlowProvider, BackgroundVariant } from "reactflow";
import "reactflow/dist/style.css";
import ClassNode from "./ClassNode";
import CustomEdge, { MarkerDefinitions } from "./CustomEdge";
import Toolbar from "./Toolbar";
import { UMLNode, UMLEdge } from "@/app/types/uml";
import { forwardRef, useImperativeHandle, ForwardedRef } from "react";

import { saveDiagramState } from "@/lib/umlUtils";

const nodeTypes = {
  classNode: ClassNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export interface DiagramCanvasRef {
  getSnapshot: () => { nodes: UMLNode[]; edges: UMLEdge[] };
  getSerializedState: () => string;
  setNodes: (newNodes: UMLNode[]) => void;
  setDiagram: (newNodes: UMLNode[], newEdges: UMLEdge[]) => void;
}

const DiagramInner = forwardRef((props: any, ref: ForwardedRef<DiagramCanvasRef>) => {
  const {
    nodes, edges, onNodesChange, onEdgesChange,
    onConnect, addClass, selectedRelation, setSelectedRelation,
    setNodes, setEdges,
  } = useDiagram();

  // This is the magic part: it makes 'nodes' and 'edges' 
  // available to whoever holds a reference to this component.
  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({ nodes, edges }),
    getSerializedState: () => saveDiagramState(nodes, edges),
    setNodes: (newNodes: UMLNode[]) => setNodes(newNodes),
    setDiagram: (newNodes: UMLNode[], newEdges: UMLEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }));

  DiagramInner.displayName = "DiagramInner";

  const handleSubmit = () => {
    // We'll move the actual Supabase call to the LecturerPage, 
    // but you can keep this for local feedback.
    console.log("Canvas snapshot captured.");
  };

  return (
    <div className="w-full h-full relative bg-slate-950">
      <MarkerDefinitions />

      {/* Toolbar */}
      <Toolbar
        onAddClass={addClass}
        selectedRelation={selectedRelation}
        onRelationChange={setSelectedRelation}
        onSubmit={handleSubmit}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        style={{ background: "transparent" }}
      >
        <Background color="#334155" gap={30} variant={BackgroundVariant.Dots} />
        <Controls
          className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl scale-110 origin-bottom-left !left-6 !bottom-6"
          showInteractive={false}
        >
          <style jsx global>{`
            .react-flow__controls-button {
              background: #0f172a !important;
              border-bottom: 1px solid #334155 !important;
              fill: #f8fafc !important;
              transition: all 0.2s ease !important;
            }
            .react-flow__controls-button:hover {
              background: #1e293b !important;
              fill: #3b82f6 !important;
            }
            .react-flow__controls-button svg {
              width: 14px !important;
              height: 14px !important;
            }
          `}</style>
        </Controls>
      </ReactFlow>

    </div>
  );
});

export default forwardRef(function DiagramCanvas(props: any, ref: ForwardedRef<DiagramCanvasRef>) {
  return (
    <ReactFlowProvider>
      <DiagramInner ref={ref} />
    </ReactFlowProvider>
  );
});

