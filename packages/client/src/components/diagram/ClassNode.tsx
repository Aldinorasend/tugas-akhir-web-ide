import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { UMLClassData, AccessModifier, Attribute, Method } from "@/app/types/uml";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/app/utils/id";

export default function ClassNode({
  id,
  data,
}: NodeProps<UMLClassData>) {
  const { name, attributes = [], methods = [], isAbstract, isInterface, readOnly, onUpdate, onDelete } = data;
  const { setNodes, setEdges } = useReactFlow();

  const updateNodeData = (updates: Partial<UMLClassData>) => {
    if (onUpdate) {
      onUpdate(id, updates);
    } else {
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
    }
  };

  const toggleConcrete = () => {
    updateNodeData({ isAbstract: false, isInterface: false });
  };

  const toggleAbstract = () => {
    updateNodeData({ isAbstract: isAbstract ? undefined : true, isInterface: false });
  };

  const toggleInterface = () => {
    updateNodeData({ isInterface: isInterface ? undefined : true, isAbstract: false });
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

  const updateAttribute = (attrId: string, updates: Partial<Attribute>) => {
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
      parameters: "",
      returnType: "void",
      access: "+" as AccessModifier,
    };
    updateNodeData({ methods: [...methods, newMethod] });
  };

  const updateMethod = (methodId: string, updates: Partial<Method>) => {
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
    if (onDelete) {
      onDelete(id);
    } else {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    }
  };

  const COMMON_TYPES = [
    "int", "String", "boolean", "double", "float", "long", "char", "byte",
    "void", "List", "Map", "Set", "Object"
  ];

  const isNotSelected = isAbstract === undefined && isInterface === undefined;

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden min-w-[320px] text-slate-200 font-sans`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-slate-400 border border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-slate-400 border border-slate-900" />
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-400 border border-slate-900" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-400 border border-slate-900" />

      {/* Class Name Header */}
      <div className="bg-slate-950 p-2.5 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1.5">
            {!readOnly && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleConcrete(); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${isAbstract === false && isInterface === false ? 'bg-slate-800 text-slate-200 border border-slate-650' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'}`}
                >
                  CLASS
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAbstract(); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${isAbstract ? 'bg-slate-800 text-slate-200 border border-slate-650' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'}`}
                >
                  ABSTRACT
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleInterface(); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${isInterface ? 'bg-slate-800 text-slate-200 border border-slate-650' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'}`}
                >
                  INTERFACE
                </button>
              </>
            )}
          </div>
          {!readOnly && (
            <button
              onClick={handleDelete}
              className="nodrag nopan text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          {isNotSelected && <span className="text-[9px] text-slate-400 font-semibold mb-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">« Pilih Tipe »</span>}
          {isInterface && <span className="text-[10px] text-slate-400 font-semibold mb-0.5">«interface»</span>}
          {isAbstract && <span className="text-[10px] text-slate-400 font-semibold mb-0.5">«abstract»</span>}
          {readOnly ? (
            <span className={`font-bold text-center text-sm w-full px-2 py-0.5 text-white ${isAbstract ? 'italic' : ''}`}>
              {name}
            </span>
          ) : (
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`nodrag nopan font-bold text-center text-sm w-full bg-slate-900 border border-slate-800 outline-none focus:border-slate-700 px-2 py-0.5 rounded transition-all text-white ${isAbstract ? 'italic' : ''}`}
              placeholder="ClassName"
            />
          )}
        </div>
      </div>

      {/* Attributes Section */}
      <div className="p-2.5 border-b border-slate-700 space-y-1.5 bg-slate-900/40">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-semibold text-slate-400">Attributes</span>
          {!readOnly && (
            <button onClick={addAttribute} className="nodrag nopan text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors">
              <Plus size={13} />
            </button>
          )}
        </div>
        {attributes.length === 0 && <div className="text-[10px] text-slate-600 italic px-1">No attributes defined</div>}
        {attributes.map((attr) => (
          <div key={attr.id} className="flex items-center gap-1 group/row">
            {readOnly ? (
              <div className="flex items-center gap-1 text-[11px] w-full">
                <span className="text-slate-400 font-semibold w-3.5">{attr.access}</span>
                <span className="text-slate-300">{attr.name}</span>
                <span className="text-slate-500">:</span>
                <span className="text-slate-300 font-mono">{attr.type}</span>
              </div>
            ) : (
              <>
                <select
                  value={attr.access}
                  onChange={(e) => updateAttribute(attr.id, { access: e.target.value as AccessModifier })}
                  className="nodrag nopan bg-slate-950 text-slate-300 text-[11px] font-semibold rounded outline-none px-1 py-0.5 border border-slate-800 focus:border-slate-700 shrink-0"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="#">#</option>
                </select>
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                  className="nodrag nopan text-[11px] flex-1 bg-slate-950 border border-slate-800 outline-none focus:border-slate-700 px-1.5 py-0.5 rounded text-slate-300 min-w-0"
                  placeholder="name"
                />
                <span className="text-[11px] text-slate-500">:</span>
                <input
                  list="common-types"
                  type="text"
                  value={attr.type}
                  onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                  className="nodrag nopan text-[11px] w-20 bg-slate-950 border border-slate-800 outline-none focus:border-slate-700 px-1 py-0.5 rounded text-slate-300 font-mono shrink-0"
                  placeholder="type"
                />
                <button onClick={(e) => removeAttribute(e, attr.id)} className="nodrag nopan text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors flex items-center justify-center shrink-0">
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Methods Section */}
      <div className="p-2.5 space-y-1.5 bg-slate-900/20">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-semibold text-slate-400">Methods</span>
          {!readOnly && (
            <button onClick={addMethod} className="nodrag nopan text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors">
              <Plus size={13} />
            </button>
          )}
        </div>
        {methods.length === 0 && <div className="text-[10px] text-slate-600 italic px-1">No methods defined</div>}
        {methods.map((method) => (
          <div key={method.id} className="flex items-center gap-1 group/row">
            {readOnly ? (
              <div className="flex items-center gap-1 text-[11px] w-full">
                <span className="text-slate-400 font-semibold w-3.5">{method.access}</span>
                <span className="text-slate-300">{method.name}</span>
                <span className="text-slate-500 font-mono">({method.parameters || ""})</span>
                <span className="text-slate-500">:</span>
                <span className="text-slate-300 font-mono">{method.returnType}</span>
              </div>
            ) : (
              <>
                <select
                  value={method.access}
                  onChange={(e) => updateMethod(method.id, { access: e.target.value as AccessModifier })}
                  className="nodrag nopan bg-slate-950 text-slate-300 text-[11px] font-semibold rounded outline-none px-1 py-0.5 border border-slate-800 focus:border-slate-700 shrink-0"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="#">#</option>
                </select>
                <input
                  type="text"
                  value={method.name}
                  onChange={(e) => updateMethod(method.id, { name: e.target.value })}
                  className="nodrag nopan text-[11px] flex-1 bg-slate-950 border border-slate-800 outline-none focus:border-slate-700 px-1.5 py-0.5 rounded text-slate-300 min-w-0"
                  placeholder="method"
                />
                <span className="text-[11px] text-slate-500 font-mono shrink-0">(</span>
                <input
                  type="text"
                  value={method.parameters || ""}
                  onChange={(e) => updateMethod(method.id, { parameters: e.target.value })}
                  className="nodrag nopan text-[11px] w-20 bg-slate-950 border border-slate-800 outline-none focus:border-slate-700 px-1 py-0.5 rounded text-slate-300 font-mono shrink-0"
                  placeholder="params"
                />
                <span className="text-[11px] text-slate-500 font-mono shrink-0">):</span>
                <input
                  list="common-types-void"
                  type="text"
                  value={method.returnType}
                  onChange={(e) => updateMethod(method.id, { returnType: e.target.value })}
                  className="nodrag nopan text-[11px] w-14 bg-slate-950 border border-slate-800 outline-none focus:border-slate-700 px-1 py-0.5 rounded text-slate-300 font-mono shrink-0"
                  placeholder="type"
                />
                <button onClick={(e) => removeMethod(e, method.id)} className="nodrag nopan text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors flex items-center justify-center shrink-0">
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Datalists for custom autocomplete */}
      <datalist id="common-types">
        {COMMON_TYPES.filter(t => t !== 'void').map(type => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <datalist id="common-types-void">
        {COMMON_TYPES.map(type => (
          <option key={type} value={type} />
        ))}
      </datalist>
    </div>
  );
}
