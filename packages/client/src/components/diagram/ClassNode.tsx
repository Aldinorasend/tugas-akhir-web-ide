import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { UMLClassData, AccessModifier } from "@/app/types/uml";
import { Plus, Trash2, X } from "lucide-react";
import { generateId } from "@/app/utils/id";

export default function ClassNode({
  id,
  data,
}: NodeProps<UMLClassData>) {
  const { name, attributes = [], methods = [], isAbstract, isInterface, readOnly } = data;
  const { setNodes, setEdges } = useReactFlow();

  const updateNodeData = (updates: Partial<UMLClassData>) => {
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
  };

  const toggleAbstract = () => {
    updateNodeData({ isAbstract: !isAbstract, isInterface: false });
  };

  const toggleInterface = () => {
    updateNodeData({ isInterface: !isInterface, isAbstract: false });
  };

  const handleNameChange = (newName: string) => {
    updateNodeData({ name: newName });
  };

  const addAttribute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newAttr = {
      id: generateId(),
      name: "newAttr",
      type: "int",
      access: "-" as AccessModifier,
    };
    updateNodeData({ attributes: [...attributes, newAttr] });
  };

  const updateAttribute = (attrId: string, updates: any) => {
    const newAttributes = attributes.map((attr) =>
      attr.id === attrId ? { ...attr, ...updates } : attr
    );
    updateNodeData({ attributes: newAttributes });
  };

  const removeAttribute = (e: React.MouseEvent, attrId: string) => {
    e.stopPropagation();
    const newAttributes = attributes.filter((attr) => attr.id !== attrId);
    updateNodeData({ attributes: newAttributes });
  };

  const addMethod = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMethod = {
      id: generateId(),
      name: "newMethod",
      returnType: "void",
      access: "+" as AccessModifier,
    };
    updateNodeData({ methods: [...methods, newMethod] });
  };

  const updateMethod = (methodId: string, updates: any) => {
    const newMethods = methods.map((m) =>
      m.id === methodId ? { ...m, ...updates } : m
    );
    updateNodeData({ methods: newMethods });
  };

  const removeMethod = (e: React.MouseEvent, methodId: string) => {
    e.stopPropagation();
    const newMethods = methods.filter((m) => m.id !== methodId);
    updateNodeData({ methods: newMethods });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const COMMON_TYPES = [
    "int", "String", "boolean", "double", "float", "long", "char", "byte",
    "void", "List", "Map", "Set", "Object"
  ];

  return (
    <div className={`bg-slate-800 border-2 ${isInterface ? 'border-purple-500/50' : isAbstract ? 'border-amber-500/50' : 'border-slate-700'} rounded-xl shadow-2xl overflow-hidden min-w-[260px] transition-all hover:border-blue-500/50 group text-slate-200`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-slate-800" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-slate-800" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-slate-800" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-slate-800" />

      {/* Class Name Header */}
      <div className="bg-slate-900 p-3 border-b-2 border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            {!readOnly && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleAbstract(); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${isAbstract ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >
                  ABSTRACT
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleInterface(); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${isInterface ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >
                  INTERFACE
                </button>
              </>
            )}
          </div>
          {!readOnly && (
            <button 
              onClick={handleDelete}
              className="nodrag nopan text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          {isInterface && <span className="text-[10px] text-purple-400 font-bold mb-1">«interface»</span>}
          {isAbstract && <span className="text-[10px] text-amber-400 font-bold mb-1">«abstract»</span>}
          {readOnly ? (
            <span className={`font-bold text-center w-full px-2 py-1 text-white ${isAbstract ? 'italic' : ''}`}>
              {name}
            </span>
          ) : (
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`nodrag nopan font-bold text-center w-full bg-slate-800 outline-none focus:ring-1 focus:ring-blue-500/50 px-2 py-1 rounded transition-all text-white ${isAbstract ? 'italic' : ''}`}
              placeholder="ClassName"
            />
          )}
        </div>
      </div>

      {/* Attributes Section */}
      <div className="p-3 border-b-2 border-slate-700 space-y-2 bg-slate-800/50">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attributes</span>
          {!readOnly && (
            <button onClick={addAttribute} className="nodrag nopan text-slate-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition-colors">
              <Plus size={14} />
            </button>
          )}
        </div>
        {attributes.length === 0 && <div className="text-[10px] text-slate-600 italic px-1">No attributes defined</div>}
        {attributes.map((attr) => (
          <div key={attr.id} className="flex items-center gap-1.5 group/row">
            {readOnly ? (
              <div className="flex items-center gap-1.5 text-[11px] w-full">
                <span className="text-blue-400 font-bold w-4">{attr.access}</span>
                <span className="text-slate-300">{attr.name}</span>
                <span className="text-slate-600">:</span>
                <span className="text-emerald-400 font-mono">{attr.type}</span>
              </div>
            ) : (
              <>
                <select
                  value={attr.access}
                  onChange={(e) => updateAttribute(attr.id, { access: e.target.value })}
                  className="nodrag nopan bg-slate-900 text-blue-400 text-[11px] font-bold rounded-md outline-none px-1 py-1 border border-slate-700 focus:border-blue-500/50"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="#">#</option>
                </select>
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                  className="nodrag nopan text-[11px] w-full bg-slate-900 border border-slate-700 outline-none focus:border-blue-500/50 px-1.5 py-1 rounded transition-colors text-slate-300"
                  placeholder="name"
                />
                <span className="text-[11px] text-slate-600 font-bold">:</span>
                <select
                  value={attr.type}
                  onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                  className="nodrag nopan text-[11px] w-24 bg-slate-900 border border-slate-700 outline-none focus:border-blue-500/50 px-1 py-1 rounded text-emerald-400 font-mono"
                >
                  {COMMON_TYPES.filter(t => t !== 'void').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  {!COMMON_TYPES.includes(attr.type) && (
                    <option value={attr.type}>{attr.type}</option>
                  )}
                </select>
                <button onClick={(e) => removeAttribute(e, attr.id)} className="nodrag nopan text-slate-600 hover:text-red-400 opacity-0 group-row-hover:opacity-100 p-0.5 transition-opacity">
                  <X size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Methods Section */}
      <div className="p-3 space-y-2 bg-slate-800/30">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Methods</span>
          {!readOnly && (
            <button onClick={addMethod} className="nodrag nopan text-slate-500 hover:text-blue-400 p-1 hover:bg-blue-500/10 rounded transition-colors">
              <Plus size={14} />
            </button>
          )}
        </div>
        {methods.length === 0 && <div className="text-[10px] text-slate-600 italic px-1">No methods defined</div>}
        {methods.map((method) => (
          <div key={method.id} className="flex items-center gap-1.5 group/row">
            {readOnly ? (
              <div className="flex items-center gap-1.5 text-[11px] w-full">
                <span className="text-blue-400 font-bold w-4">{method.access}</span>
                <span className="text-slate-300">{method.name}</span>
                <span className="text-slate-600">():</span>
                <span className="text-amber-400 font-mono">{method.returnType}</span>
              </div>
            ) : (
              <>
                <select
                  value={method.access}
                  onChange={(e) => updateMethod(method.id, { access: e.target.value })}
                  className="nodrag nopan bg-slate-900 text-blue-400 text-[11px] font-bold rounded-md outline-none px-1 py-1 border border-slate-700 focus:border-blue-500/50"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="#">#</option>
                </select>
                <input
                  type="text"
                  value={method.name}
                  onChange={(e) => updateMethod(method.id, { name: e.target.value })}
                  className="nodrag nopan text-[11px] w-full bg-slate-900 border border-slate-700 outline-none focus:border-blue-500/50 px-1.5 py-1 rounded transition-colors text-slate-300"
                  placeholder="method"
                />
                <span className="text-[11px] text-slate-600 font-bold">():</span>
                <select
                  value={method.returnType}
                  onChange={(e) => updateMethod(method.id, { returnType: e.target.value })}
                  className="nodrag nopan text-[11px] w-24 bg-slate-900 border border-slate-700 outline-none focus:border-blue-500/50 px-1 py-1 rounded text-amber-400 font-mono"
                >
                  {COMMON_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  {!COMMON_TYPES.includes(method.returnType) && (
                    <option value={method.returnType}>{method.returnType}</option>
                  )}
                </select>
                <button onClick={(e) => removeMethod(e, method.id)} className="nodrag nopan text-slate-600 hover:text-red-400 opacity-0 group-row-hover:opacity-100 p-0.5 transition-opacity">
                  <X size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



