import {parse} from "java-parser";

const getIdentifier = (node) => {
    return(node ?. children ?. Identifier ?. [0] ?. image || null);
};

const getAccessModifier = (modifiers) => {

    if (!modifiers || !Array.isArray(modifiers)) {
        return "public";
    }

    for (const modifier of modifiers) {

        const children = modifier.children;

        if (children.Private) {
            return "private";
        }

        if (children.Protected) {
            return "protected";
        }

        if (children.Public) {
            return "public";
        }
    }

    return "public";
};


const getTypeName = (unannType) => {

    if (!unannType) {
        return "void";
    }

    const children = unannType.children;

    const referenceType = children ?. unannReferenceType ?. [0] ?. children ?. unannClassOrInterfaceType ?. [0] ?. children ?. unannClassType ?. [0];

    if (referenceType) {

        return getIdentifier(referenceType);
    }

    const primitiveNode = children ?. unannPrimitiveType ?. [0] || children ?. unannPrimitiveTypeWithOptionalDimsSuffix ?. [0] ?. children ?. unannPrimitiveType ?. [0];

    const primitive = primitiveNode ?. children;

    if (! primitive) {
        return "void";
    }

    if (primitive.numericType ?. [0] ?. children ?. integralType ?. [0] ?. children ?. Int) {
        return "int";
    }

    if (primitive.numericType ?. [0] ?. children ?. floatingPointType ?. [0] ?. children ?. Float) {
        return "float";
    }

    if (primitive.numericType ?. [0] ?. children ?. floatingPointType ?. [0] ?. children ?. Double) {
        return "double";
    }

    if (primitive.Boolean) {
        return "boolean";
    }

    if (primitive.Char) {
        return "char";
    }

    return "void";
};

/**
 * =================================
 * PARAMETER EXTRACTOR
 * =================================
 */

const extractParameters = (methodDeclarator) => {

    const parameterList = methodDeclarator ?. children ?. formalParameterList ?. [0];

    if (! parameterList) {
        return [];
    }

    const results = [];

    /**
   * FORMAL PARAMS
   */

    const formalParams = parameterList ?. children ?. formalParameter || [];

    formalParams.forEach((param) => {

        const unannType = param ?. children ?. variableParaRegularParameter ?. [0] ?. children ?. unannType ?. [0];

        const type = getTypeName(unannType);

        if (type && type !== "void") {
            results.push(type);
        }
    });

    /**
   * LAST PARAM
   */

    const lastParam = parameterList ?. children ?. lastFormalParameter ?. [0];

    if (lastParam) { /**
     * NORMAL PARAM
     */

        const normalType = getTypeName(lastParam ?. children ?. variableParaRegularParameter ?. [0] ?. children ?. unannType ?. [0]);

        if (normalType && normalType !== "void") {
            results.push(normalType);
        }

        /**
     * VAR ARG
     */

        const varArgType = getTypeName(lastParam ?. children ?. variableArityParameter ?. [0] ?. children ?. unannType ?. [0]);

        if (varArgType && varArgType !== "void") {
            results.push(varArgType);
        }
    }

    return results;
};


const extractAttribute = (fieldDecl) => {

    const variable = fieldDecl ?. children ?. variableDeclaratorList ?. [0] ?. children ?. variableDeclarator ?. [0];

    const fieldName = variable ?. children ?. variableDeclaratorId ?. [0] ?. children ?. Identifier ?. [0] ?. image;

    const fieldType = getTypeName(fieldDecl ?. children ?. unannType ?. [0]);

    const modifiers = fieldDecl ?. children ?. fieldModifier;

    return {name: fieldName, type: fieldType, access: getAccessModifier(modifiers)};
};


const extractMethod = (methodDecl) => {

    const header = methodDecl ?. children ?. methodHeader ?. [0] ?. children;

    if (! header) {
        return null;
    }

    const methodDeclarator = header ?. methodDeclarator ?. [0];

    const methodName = methodDeclarator ?. children ?. Identifier ?. [0] ?. image;

    const returnType = getTypeName(header ?. result ?. [0] ?. children ?. unannType ?. [0]);

    const modifiers = methodDecl ?. children ?. methodModifier || methodDecl ?. children ?. interfaceMethodModifier;

    const isOverride = modifiers ?. some((modifier) => JSON.stringify(modifier).includes("Override")) || false;

    return {
        name: methodName,
        returnType,
        access: getAccessModifier(modifiers),
        parameters: extractParameters(methodDeclarator),
        isOverride
    };
};
const extractConstructor = (constructorDecl) => {

    if (!constructorDecl) {
        return null;
    }

    const constructorDeclarator = constructorDecl ?. children ?. constructorDeclarator ?. [0];

    const name = constructorDeclarator ?. children ?. simpleTypeName ?. [0] ?. children ?. Identifier ?. [0] ?. image;

    const parameters = extractParameters(constructorDeclarator);

    const body = constructorDecl ?. children ?. constructorBody ?. [0];

    const hasSuperCall = JSON.stringify(body).includes('"image":"super"');

    return {name, parameters, hasSuperCall};
};

const extractTypeDeclaration = (typeDecl) => {
    const classDecl = typeDecl ?. children ?. classDeclaration ?. [0] ?. children ?. normalClassDeclaration ?. [0];
    const interfaceDecl = typeDecl ?. children ?. interfaceDeclaration ?. [0] ?. children ?. normalInterfaceDeclaration ?. [0];
    if (! classDecl && ! interfaceDecl) {
        return null;
    }

    const isInterface = !! interfaceDecl;
    const nameNode = classDecl ? classDecl ?. children ?. typeIdentifier ?. [0] : interfaceDecl ?. children ?. typeIdentifier ?. [0];

    const name = nameNode ?. children ?. Identifier ?. [0] ?. image;

    const isAbstract = typeDecl ?. children ?. classDeclaration ?. [0] ?. children ?. classModifier ?. some((m) => m ?. children ?. Abstract) || false;

    const superClass = classDecl ?. children ?. classExtends ?. [0] ?. children ?. classType ?. [0] ?. children ?. Identifier ?. [0] ?. image || null;

    const implementedInterfaces = [];

    const classImplementsNode = classDecl ?. children ?. classImplements ?. [0];

    if (classImplementsNode) {

        const interfaceTypeList = classImplementsNode.children ?. interfaceTypeList ?. [0];

        if (interfaceTypeList) {

            const interfaceTypes = interfaceTypeList.children ?. interfaceType || [];

            interfaceTypes.forEach((it) => {

                const identifier = it.children ?. classType ?. [0] ?. children ?. Identifier ?. [0] ?. image;

                if (identifier) {

                    implementedInterfaces.push(identifier);
                }
            });
        }
    }

    const attributes = [];
    const methods = [];
    const constructors = [];

    if (classDecl) {

        const bodyDeclarations = classDecl ?. children ?. classBody ?. [0] ?. children ?. classBodyDeclaration || [];

        bodyDeclarations.forEach((body) => { /**
         * CONSTRUCTOR
         */

            const constructorDecl = body ?. children ?. constructorDeclaration ?. [0];

            if (constructorDecl) {

                const constructor = extractConstructor(constructorDecl);

                if (constructor) {

                    constructors.push(constructor);
                }
            }

            const member = body ?. children ?. classMemberDeclaration ?. [0];

            if (! member) {
                return;
            }
            const fieldDecl = member ?. children ?. fieldDeclaration ?. [0];

            if (fieldDecl) {

                attributes.push(extractAttribute(fieldDecl));
            }
            const methodDecl = member ?. children ?. methodDeclaration ?. [0];

            if (methodDecl) {

                const method = extractMethod(methodDecl);

                if (method) {

                    methods.push(method);
                }
            }
        });
    }
    if (interfaceDecl) {

        const interfaceMembers = interfaceDecl ?. children ?. interfaceBody ?. [0] ?. children ?. interfaceMemberDeclaration || [];

        interfaceMembers.forEach((member) => {

            const methodDecl = member ?. children ?. interfaceMethodDeclaration ?. [0];

            if (methodDecl) {

                const method = extractMethod(methodDecl);

                if (method) {

                    methods.push(method);
                }
            }
        });
    }
    const overloadMethods = [];

    methods.forEach((methodA, indexA) => {

        methods.forEach((methodB, indexB) => {

            if (indexA === indexB) {
                return;
            }

            const sameName = methodA.name === methodB.name;

            const differentParams = JSON.stringify(methodA.parameters) !== JSON.stringify(methodB.parameters);

            if (sameName && differentParams) {

                overloadMethods.push(methodA.name);
            }
        });
    });

    return {
        name,
        isInterface,
        isAbstract,
        superClass,
        implementedInterfaces,
        attributes,
        methods,
        constructors,
        overloadMethods: [
            ...new Set(overloadMethods),
        ]
    };
};

const analyzeJavaFile = (content) => {

    try {

        const cst = parse(content);

        const ordinaryUnit = cst ?. children ?. ordinaryCompilationUnit ?. [0];

        if (! ordinaryUnit) {
            return [];
        }

        const typeDeclarations = ordinaryUnit ?. children ?. typeDeclaration || [];

        return typeDeclarations.map(extractTypeDeclaration).filter(Boolean);

    } catch (err) {

        console.error("Java Parse Error:", err.message);

        return [];
    }
};


const compareParameters = (actual = [], expected = []) => {

    if (actual.length !== expected.length) {
        return false;
    }

    return actual.every((param, index) => param ?. toLowerCase() === expected[index] ?. toLowerCase());
};


// Validator Aturan
const validateRule = (rule, classes) => {


    switch (rule.type) {
        case "class":
            {

                const target = classes.find((c) => c.name === rule.name);

                console.log("TARGET CLASS:", target);

                return(!! target && ! target.isAbstract && ! target.isInterface);
            }
        case "abstract_class":
            {

                const target = classes.find((c) => c.name === rule.name);

                return(!! target && target.isAbstract);
            }
        case "interface":
            {

                const target = classes.find((c) => c.name === rule.name);

                return(!! target && target.isInterface);
            }
        case "attribute":
            {

                const target = classes.find((c) => c.name === rule.class);

                console.log("ATTRIBUTE TARGET:", target);

                if (! target) {
                    return false;
                }

                return target.attributes.some((attr) => {

                    console.log("CHECK ATTRIBUTE:", attr);

                    return(attr.name === rule.name && attr.type === rule.dataType && attr.access === rule.access);
                });
            }
        case "method":
            {

                const target = classes.find((c) => c.name === rule.class);

                console.log("METHOD TARGET:", target);

                if (! target) {
                    return false;
                }

                return target.methods.some((method) => {

                    console.log("CHECK METHOD:", method);

                    const sameParams = compareParameters(method.parameters, rule.parameters);

                    console.log("PARAM RESULT:", sameParams);

                    return(method.name === rule.name && method.returnType === rule.returnType && method.access === rule.access && sameParams);
                });
            }

        case "extends":
            {

                const target = classes.find((c) => c.name === rule.class);

                console.log("EXTENDS TARGET:", target);

                if (! target) {
                    return false;
                }

                return(target.superClass === rule.parent);
            }


        case "implements":
            {

                const target = classes.find((c) => c.name === rule.class);

                if (! target) {
                    return false;
                }

                return target.implementedInterfaces.includes(rule.interface);
            }


        case "override":
            {

                const target = classes.find((c) => c.name === rule.class);

                console.log("OVERRIDE TARGET:", target);

                if (! target) {
                    return false;
                }

                return target.methods.some((method) => method.name === rule.method && method.isOverride);
            }
        case "overload":
            {

                const target = classes.find((c) => c.name === rule.class);

                console.log("OVERLOAD TARGET:", target);

                if (! target) {
                    return false;

                }

                return target.overloadMethods.includes(rule.method);
            }

        default:
            return false;
    }
};

// Main Logic

export const compareCodeWithLogic = (fileArray, logicRulesRaw) => {

    try {

        let allClassesInfo = [];

        fileArray.forEach((file) => {

            if (!file.content ?. trim()) {
                return;
            }

            const extracted = analyzeJavaFile(file.content);

            allClassesInfo = [
                ... allClassesInfo,
                ... extracted,
            ];
        });

        const results = logicRulesRaw.map((rule) => {

            const isMatch = validateRule(rule, allClassesInfo);
            return {
                rule,
                status: isMatch ? "MATCH" : "MISMATCH"
            };
        });

        return {success: true, classes: allClassesInfo, results};

    } catch (err) {

        return {success: false, error: "PROCESSING_ERROR", message: err.message};
    }
};
