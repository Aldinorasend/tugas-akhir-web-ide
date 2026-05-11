import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from 'reactflow';
import { UMLRelationData } from '@/app/types/uml';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<UMLRelationData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const type = data?.type || 'inheritance';

  // Define edge style based on type
  const edgeStyle = {
    ...style,
    strokeWidth: 2,
    stroke: type === 'inheritance' ? '#f97316' : type === 'interface' ? '#8b5cf6' : '#3b82f6',
    strokeDasharray: type === 'interface' ? '5,5' : undefined,
  };

  // Marker ID selection
  const markerId = `url(#marker-${type})`;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerId} style={edgeStyle} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#0f172a',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: '1px solid #334155',
              color: type === 'inheritance' ? '#f97316' : type === 'interface' ? '#a78bfa' : '#3b82f6',
              pointerEvents: 'all',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            className="nodrag nopan uppercase tracking-wider"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Marker Definitions component to be included in the DiagramCanvas
export const MarkerDefinitions = () => (
  <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
    <defs>
      {/* Inheritance: Hollow Triangle */}
      <marker
        id="marker-inheritance"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" stroke="#f97316" strokeWidth="1" />
      </marker>

      {/* Interface: Hollow Triangle */}
      <marker
        id="marker-interface"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1" />
      </marker>

      {/* Association: Open Arrow (Relasi Biasa) */}
      <marker
        id="marker-association"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 9 5 L 0 8.5" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    </defs>
  </svg>
);

