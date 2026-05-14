
export const transformDiagramToLogic = (nodes = [], edges = []) => {
    const logicRules = [];

    // 1. Transformasi Nodes (Class, Interface, Abstract)
    nodes.forEach((node) => {
        const { name, isInterface, isAbstract, attributes, methods } = node.data;

        if (isInterface) {
            logicRules.push(`interface(${name}).`);
        } else if (isAbstract) {
            logicRules.push(`abstract_class(${name}).`);
        } else {
            logicRules.push(`class(${name}).`);
        }

        // Map Attributes
        if (attributes) {
            attributes.forEach((attr) => {
                const access = attr.access === "+" ? "public" : "private";
                logicRules.push(`attribute(${name}, ${attr.name}, ${attr.type}, ${access}).`);
            });
        }

        // Map Methods
        if (methods) {
            methods.forEach((method) => {
                const access = method.access === "+" ? "public" : "private";
                logicRules.push(`method(${name}, ${method.name}, ${method.returnType}, ${access}).`);
            });
        }
    });

    // 2. Transformasi Edges (Relationships)
    edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
            const sourceName = sourceNode.data.name;
            const targetName = targetNode.data.name;

            // Logika pewarisan (Inheritance)
            if (edge.data?.type === "inheritance") {
                logicRules.push(`extends(${sourceName}, ${targetName}).`);
            }
        }
    });

    return logicRules;
};

