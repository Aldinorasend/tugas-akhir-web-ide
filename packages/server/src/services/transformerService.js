export const transformDiagramToLogic = (nodes = [], edges = []) => {

    const logicRules = [];
    nodes.forEach((node) => {

        const {
            name,
            isInterface,
            isAbstract,
            attributes,
            methods
        } = node.data;
        if (isInterface) {
            logicRules.push({type: "interface", name});

        } else if (isAbstract) {
            logicRules.push({type: "abstract_class", name});

        } else {
            logicRules.push({type: "class", name});
        }
        if (attributes) {

            attributes.forEach((attr) => {

                logicRules.push({
                    type: "attribute",
                    class: name,
                    name: attr.name,
                    dataType: attr.type,
                    access: attr.access === "+" ? "public" : attr.access === "#" ? "protected" : "private"
                });

            });

        }

        if (methods) {

            methods.forEach((method) => {
                let parameters = [];

                if (method.parameters && method.parameters.trim() !== "") {

                    parameters = method.parameters.split(",").map((p) => p.trim().split(" ")[0]);

                }

                logicRules.push({
                    type: "method",
                    class: name,
                    name: method.name,
                    parameters,
                    returnType: method.returnType,
                    access: method.access === "+" ? "public" : method.access === "#" ? "protected" : "private"
                });

            });

        }

    });

    edges.forEach((edge) => {

        const sourceNode = nodes.find((n) => n.id === edge.source);

        const targetNode = nodes.find((n) => n.id === edge.target);

        if (! sourceNode || ! targetNode) {
            return;
        }

        const sourceName = sourceNode.data.name;

        const targetName = targetNode.data.name;


        if (edge.data ?. type === "inheritance") {

            logicRules.push({type: "extends", class: targetName, parent: sourceName});

        } else if (edge.data ?. type === "interface") {

            logicRules.push({type: "implements", class: targetName, interface: sourceName});

        }

    });

    nodes.forEach((childNode) => {

        const inheritanceEdge = edges.find((e) => e.data ?. type === "inheritance" && e.target === childNode.id);

        if (! inheritanceEdge) {
            return;
        }

        const parentNode = nodes.find((n) => n.id === inheritanceEdge.source);

        if (! parentNode) {
            return;
        }

        const childMethods = childNode.data.methods || [];

        const parentMethods = parentNode.data.methods || [];

        childMethods.forEach((childMethod) => {

            const childParams = childMethod.parameters ?. split(",").map((p) => p.trim().split(" ")[0]) || [];

            const isOverride = parentMethods.some((parentMethod) => {

                const parentParams = parentMethod.parameters ?. split(",").map((p) => p.trim().split(" ")[0]) || [];

                return(childMethod.name === parentMethod.name && childMethod.returnType === parentMethod.returnType && JSON.stringify(childParams) === JSON.stringify(parentParams));
            });

            if (isOverride) {

                logicRules.push({type: "override", class: childNode.data.name, method: childMethod.name});

            }

        });

    });

    nodes.forEach((node) => {

        const methods = node.data.methods || [];

        const grouped = {};

        methods.forEach((method) => {

            if (! grouped[method.name]) {
                grouped[method.name] = [];
            }

            grouped[method.name].push(method);

        });

        Object.entries(grouped).forEach(([methodName, sameMethods]) => {

            if (sameMethods.length < 2) {
                return;
            }

            const signatures = sameMethods.map((m) => JSON.stringify(m.parameters));

            const unique = new Set(signatures);

            if (unique.size > 1) {

                logicRules.push({type: "overload", class: node.data.name, method: methodName});

            }

        });

    });

    return logicRules;
};
