"use client";

import ReactFlow, { Background, Controls, ReactFlowProvider, BackgroundVariant } from "reactflow";
import ClassNode from "./ClassNode";
import CustomEdge, { MarkerDefinitions } from "./CustomEdge";
import "reactflow/dist/style.css";

const nodeTypes = {
  classNode: ClassNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

interface DiagramPreviewProps {
  nodes: any[];
  edges: any[];
}

function DiagramInner({ nodes, edges }: DiagramPreviewProps) {
  const readOnlyNodes = nodes.map(node => ({
    ...node,
    data: { ...node.data, readOnly: true }
  }));

  return (
    <div className="w-full h-full relative bg-slate-950">
      <MarkerDefinitions />
      <ReactFlow
        nodes={readOnlyNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        style={{ background: "transparent" }}
      >
        <Background color="#334155" gap={30} variant={BackgroundVariant.Dots} />
        <Controls 
          showInteractive={false}
          className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}

export default function DiagramPreview({ nodes, edges }: DiagramPreviewProps) {
  return (
    <ReactFlowProvider>
      <DiagramInner nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  );
}
