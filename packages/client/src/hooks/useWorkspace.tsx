import { useState, useCallback } from "react";
import { FileNode } from "@/components/ProjectExplorer";

export const useWorkspace = (initialNodes: FileNode[] = [
  {
    id: "Main.java",
    name: "Main.java",
    type: "file",
    content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
  },
]) => {
  const [nodes, setNodes] = useState<FileNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string>("Main.java");

  const findNode = useCallback((list: FileNode[], id: string): FileNode | null => {
    for (const node of list) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const currentFile = findNode(nodes, selectedId);

  const handleToggleFolder = useCallback((nodeId: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) return { ...node, isOpen: !node.isOpen };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });
    };
    setNodes((prev) => updateNodes(prev));
  }, []);

  const handleAddFile = useCallback((parentId: string, name: string) => {
    const className = name.replace(".java", "");
    const packageName = parentId === "workspace" ? "" : parentId.replace(/\//g, ".");

    let content = "";
    if (packageName) {
      content += `package ${packageName};\n\n`;
    }

    content += `public class ${className} {\n`;
    if (className === "Main") {
      content += `    public static void main(String[] args) {\n        System.out.println("Hello from ${packageName || "root"}!");\n    }\n`;
    }
    content += `}`;

    const newNode: FileNode = {
      id: parentId === "workspace" ? name : `${parentId}/${name}`,
      name,
      type: "file",
      content,
    };

    setNodes((prev) => {
      if (parentId === "workspace") {
        setSelectedId(newNode.id);
        return [...prev, newNode];
      }

      const updateNodes = (list: FileNode[]): FileNode[] => {
        return list.map((node) => {
          if (node.id === parentId) {
            return { ...node, isOpen: true, children: [...(node.children || []), newNode] };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });
      };
      setSelectedId(newNode.id);
      return updateNodes(prev);
    });
  }, []);

  const handleAddFolder = useCallback((parentId: string, name: string) => {
    const newNode: FileNode = {
      id: parentId === "workspace" ? name : `${parentId}/${name}`,
      name,
      type: "folder",
      isOpen: true,
      children: [],
    };

    setNodes((prev) => {
      if (parentId === "workspace") {
        return [...prev, newNode];
      }

      const updateNodes = (list: FileNode[]): FileNode[] => {
        return list.map((node) => {
          if (node.id === parentId) {
            return { ...node, isOpen: true, children: [...(node.children || []), newNode] };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });
      };
      return updateNodes(prev);
    });
  }, []);

  const handleDelete = useCallback((nodeId: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list
        .filter((node) => node.id !== nodeId)
        .map((node) => {
          if (node.children) return { ...node, children: updateNodes(node.children) };
          return node;
        });
    };
    setNodes((prev) => {
      const nextNodes = updateNodes(prev);
      setSelectedId((prevSelected) => (prevSelected === nodeId ? "" : prevSelected));
      return nextNodes;
    });
  }, []);

  const handleRename = useCallback((nodeId: string, newName: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          const oldIdParts = node.id.split("/");
          oldIdParts[oldIdParts.length - 1] = newName;
          const newId = oldIdParts.join("/");

          let updatedNode = { ...node, id: newId, name: newName };

          if (node.type === "folder" && node.children) {
            const updateChildIds = (childrenList: FileNode[], parentPath: string): FileNode[] => {
              return childrenList.map((child) => {
                const childNewId = `${parentPath}/${child.name}`;
                if (child.type === "folder" && child.children) {
                  return {
                    ...child,
                    id: childNewId,
                    children: updateChildIds(child.children, childNewId)
                  };
                }
                return { ...child, id: childNewId };
              });
            };
            updatedNode.children = updateChildIds(node.children, newId);
          }

          return updatedNode;
        }

        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };

    setNodes((prevNodes) => {
      const nextNodes = updateNodes(prevNodes);

      const nodeExists = (list: FileNode[], id: string): boolean => {
        for (const n of list) {
          if (n.id === id) return true;
          if (n.children && nodeExists(n.children, id)) return true;
        }
        return false;
      };

      setSelectedId((prevSelected) => {
        if (prevSelected && !nodeExists(nextNodes, prevSelected)) {
          const findFirstFile = (tree: FileNode[]): FileNode | null => {
            for (const n of tree) {
              if (n.type === "file") return n;
              if (n.children) {
                const found = findFirstFile(n.children);
                if (found) return found;
              }
            }
            return null;
          };
          const f = findFirstFile(nextNodes);
          return f ? f.id : "";
        }
        return prevSelected;
      });

      return nextNodes;
    });
  }, []);

  const handleCodeChange = useCallback((newCode: string | undefined) => {
    if (newCode === undefined) return;
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === selectedId) return { ...node, content: newCode };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });
    };
    setNodes((prev) => updateNodes(prev));
  }, [selectedId]);

  const flattenFiles = useCallback((list: FileNode[], pathPrefix = ""): { path: string; content: string }[] => {
    let result: { path: string; content: string }[] = [];
    for (const node of list) {
      const currentPath = node.id === "root" ? "" : (pathPrefix ? `${pathPrefix}/${node.name}` : node.name);

      if (node.type === "file") {
        result.push({ path: currentPath, content: node.content || "" });
      } else if (node.children) {
        result = [...result, ...flattenFiles(node.children, currentPath)];
      }
    }
    return result;
  }, []);

  return {
    nodes,
    setNodes,
    selectedId,
    setSelectedId,
    currentFile,
    handleToggleFolder,
    handleAddFile,
    handleAddFolder,
    handleDelete,
    handleRename,
    handleCodeChange,
    flattenFiles,
  };
};
