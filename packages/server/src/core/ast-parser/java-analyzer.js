import {
  parse
} from "java-parser";

const getIdentifier = (node) => {
  return (node ?.children ?.Identifier ?. [0] ?.image || null);
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

  const referenceType = children ?.unannReferenceType ?. [0] ?.children ?.unannClassOrInterfaceType ?. [0] ?.children ?.unannClassType ?. [0];

  if (referenceType) {

    return getIdentifier(referenceType);
  }

  const primitiveNode = children ?.unannPrimitiveType ?. [0] || children ?.unannPrimitiveTypeWithOptionalDimsSuffix ?. [0] ?.children ?.unannPrimitiveType ?. [0];

  const primitive = primitiveNode ?.children;

  if (!primitive) {
    return "void";
  }

  if (primitive.numericType ?. [0] ?.children ?.integralType ?. [0] ?.children ?.Int) {
    return "int";
  }

  if (primitive.numericType ?. [0] ?.children ?.floatingPointType ?. [0] ?.children ?.Float) {
    return "float";
  }

  if (primitive.numericType ?. [0] ?.children ?.floatingPointType ?. [0] ?.children ?.Double) {
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

  const parameterList = methodDeclarator ?.children ?.formalParameterList ?. [0];

  if (!parameterList) {
    return [];
  }

  const results = [];

  /**
   * FORMAL PARAMS
   */

  const formalParams = parameterList ?.children ?.formalParameter || [];

  formalParams.forEach((param) => {

    const unannType = param ?.children ?.variableParaRegularParameter ?. [0] ?.children ?.unannType ?. [0];

    const type = getTypeName(unannType);

    if (type && type !== "void") {
      results.push(type);
    }
  });

  /**
   * LAST PARAM
   */

  const lastParam = parameterList ?.children ?.lastFormalParameter ?. [0];

  if (lastParam) {
    /**
     * NORMAL PARAM
     */

    const normalType = getTypeName(lastParam ?.children ?.variableParaRegularParameter ?. [0] ?.children ?.unannType ?. [0]);

    if (normalType && normalType !== "void") {
      results.push(normalType);
    }

    /**
     * VAR ARG
     */

    const varArgType = getTypeName(lastParam ?.children ?.variableArityParameter ?. [0] ?.children ?.unannType ?. [0]);

    if (varArgType && varArgType !== "void") {
      results.push(varArgType);
    }
  }

  return results;
};


const extractAttribute = (fieldDecl) => {

  const variable = fieldDecl ?.children ?.variableDeclaratorList ?. [0] ?.children ?.variableDeclarator ?. [0];

  const fieldName = variable ?.children ?.variableDeclaratorId ?. [0] ?.children ?.Identifier ?. [0] ?.image;

  const fieldType = getTypeName(fieldDecl ?.children ?.unannType ?. [0]);

  const modifiers = fieldDecl ?.children ?.fieldModifier;

  return {
    name: fieldName,
    type: fieldType,
    access: getAccessModifier(modifiers)
  };
};


const extractMethod = (methodDecl) => {

  const header = methodDecl ?.children ?.methodHeader ?. [0] ?.children;

  if (!header) {
    return null;
  }

  const methodDeclarator = header ?.methodDeclarator ?. [0];

  const methodName = methodDeclarator ?.children ?.Identifier ?. [0] ?.image;

  const returnType = getTypeName(header ?.result ?. [0] ?.children ?.unannType ?. [0]);

  const modifiers = methodDecl ?.children ?.methodModifier || methodDecl ?.children ?.interfaceMethodModifier;

  const isOverride = modifiers ?.some((modifier) => JSON.stringify(modifier).includes("Override")) || false;

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

  const constructorDeclarator = constructorDecl ?.children ?.constructorDeclarator ?. [0];

  const name = constructorDeclarator ?.children ?.simpleTypeName ?. [0] ?.children ?.Identifier ?. [0] ?.image;

  const parameters = extractParameters(constructorDeclarator);

  const body = constructorDecl ?.children ?.constructorBody ?. [0];

  const hasSuperCall = JSON.stringify(body).includes('"image":"super"');

  return {
    name,
    parameters,
    hasSuperCall
  };
};
const hasGetterSetter = (
  target,
  attribute
) => {

  const attrName =
    attribute.name;

  const attrType =
    attribute.type;

  const capitalized =
    attrName.charAt(0)
    .toUpperCase() +
    attrName.slice(1);

  const getterNames = [
    `get${capitalized}`,
  ];



  if (
    attrType === "boolean"
  ) {
    getterNames.push(
      `is${capitalized}`
    );
  }

  const setterName =
    `set${capitalized}`;

  const hasGetter =
    target.methods.some(
      (method) =>
      getterNames.includes(
        method.name
      ) &&
      method.returnType ===
      attrType &&
      method.parameters
      .length === 0
    );

  const hasSetter =
    target.methods.some(
      (method) =>
      method.name ===
      setterName &&
      method.returnType ===
      "void" &&
      method.parameters
      .length === 1 &&
      method.parameters[0] ===
      attrType
    );

  return {
    hasGetter,
    hasSetter,
  };
};
const extractTypeDeclaration = (typeDecl) => {
  const classDecl = typeDecl ?.children ?.classDeclaration ?. [0] ?.children ?.normalClassDeclaration ?. [0];
  const interfaceDecl = typeDecl ?.children ?.interfaceDeclaration ?. [0] ?.children ?.normalInterfaceDeclaration ?. [0];
  if (!classDecl && !interfaceDecl) {
    return null;
  }

  const isInterface = !!interfaceDecl;
  const nameNode = classDecl ? classDecl ?.children ?.typeIdentifier ?. [0] : interfaceDecl ?.children ?.typeIdentifier ?. [0];

  const name = nameNode ?.children ?.Identifier ?. [0] ?.image;

  const isAbstract = typeDecl ?.children ?.classDeclaration ?. [0] ?.children ?.classModifier ?.some((m) => m ?.children ?.Abstract) || false;

  const superClass = classDecl ?.children ?.classExtends ?. [0] ?.children ?.classType ?. [0] ?.children ?.Identifier ?. [0] ?.image || null;

  const implementedInterfaces = [];

  const classImplementsNode = classDecl ?.children ?.classImplements ?. [0];

  if (classImplementsNode) {

    const interfaceTypeList = classImplementsNode.children ?.interfaceTypeList ?. [0];

    if (interfaceTypeList) {

      const interfaceTypes = interfaceTypeList.children ?.interfaceType || [];

      interfaceTypes.forEach((it) => {

        const identifier = it.children ?.classType ?. [0] ?.children ?.Identifier ?. [0] ?.image;

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

    const bodyDeclarations = classDecl ?.children ?.classBody ?. [0] ?.children ?.classBodyDeclaration || [];

    bodyDeclarations.forEach((body) => {
      /**
       * CONSTRUCTOR
       */

      const constructorDecl = body ?.children ?.constructorDeclaration ?. [0];

      if (constructorDecl) {

        const constructor = extractConstructor(constructorDecl);

        if (constructor) {

          constructors.push(constructor);
        }
      }

      const member = body ?.children ?.classMemberDeclaration ?. [0];

      if (!member) {
        return;
      }
      const fieldDecl = member ?.children ?.fieldDeclaration ?. [0];

      if (fieldDecl) {

        attributes.push(extractAttribute(fieldDecl));
      }
      const methodDecl = member ?.children ?.methodDeclaration ?. [0];

      if (methodDecl) {

        const method = extractMethod(methodDecl);

        if (method) {

          methods.push(method);
        }
      }
    });
  }
  if (interfaceDecl) {

    const interfaceMembers = interfaceDecl ?.children ?.interfaceBody ?. [0] ?.children ?.interfaceMemberDeclaration || [];

    interfaceMembers.forEach((member) => {

      const methodDecl = member ?.children ?.interfaceMethodDeclaration ?. [0];

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

    const ordinaryUnit = cst ?.children ?.ordinaryCompilationUnit ?. [0];

    if (!ordinaryUnit) {
      return [];
    }

    const typeDeclarations = ordinaryUnit ?.children ?.typeDeclaration || [];

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

  return actual.every((param, index) => param ?.toLowerCase() === expected[index] ?.toLowerCase());
};


// Validator Aturan
const validateRule = (
  rule,
  classes
) => {
  
  switch (rule.type) {

    /**
     * =================================
     * CLASS
     * =================================
     */

    case "class": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.name
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.name} tidak ditemukan`
        };
      }

      if (target.isAbstract) {

        return {
          isMatch: false,
          message: `Class ${rule.name} merupakan abstract class`
        };
      }

      if (target.isInterface) {

        return {
          isMatch: false,
          message: `Class ${rule.name} merupakan interface`
        };
      }

      return {
        isMatch: true,
        message: `Class ${rule.name} valid`
      };
    }

    /**
     * =================================
     * ABSTRACT CLASS
     * =================================
     */

    case "abstract_class": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.name
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Abstract class ${rule.name} tidak ditemukan`
        };
      }

      if (!target.isAbstract) {

        return {
          isMatch: false,
          message: `${rule.name} bukan abstract class`
        };
      }

      return {
        isMatch: true,
        message: `Abstract class ${rule.name} valid`
      };
    }

    /**
     * =================================
     * INTERFACE
     * =================================
     */

    case "interface": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.name
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Interface ${rule.name} tidak ditemukan`
        };
      }

      if (!target.isInterface) {

        return {
          isMatch: false,
          message: `${rule.name} bukan interface`
        };
      }

      return {
        isMatch: true,
        message: `Interface ${rule.name} valid`
      };
    }

    /**
     * =================================
     * ATTRIBUTE
     * =================================
     */

    case "attribute": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const attribute =
        target.attributes.find(
          (attr) =>
          attr.name ===
          rule.name
        );

      if (!attribute) {

        return {
          isMatch: false,
          message: `Attribute ${rule.name} tidak ditemukan pada class ${rule.class}`
        };
      }

      if (
        attribute.type !==
        rule.dataType
      ) {

        return {
          isMatch: false,
          message: `Attribute ${rule.name} memiliki tipe ${attribute.type}, expected ${rule.dataType}`
        };
      }

      if (
        attribute.access !==
        rule.access
      ) {

        return {
          isMatch: false,
          message: `Attribute ${rule.name} memiliki access ${attribute.access}, expected ${rule.access}`
        };
      }

      return {
        isMatch: true,
        message: `Attribute ${rule.name} valid`
      };
    }
    

    /**
     * =================================
     * METHOD
     * =================================
     */

    case "method": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const methods =
        target.methods.filter(
          (m) =>
          m.name ===
          rule.name
        );

      if (methods.length === 0) {

        return {
          isMatch: false,
          message: `Method ${rule.name} tidak ditemukan pada class ${rule.class}`
        };
      }

      const matchedMethod =
        methods.find((method) => {

          const sameParams =
            compareParameters(
              method.parameters,
              rule.parameters
            );

          return (
            sameParams &&
            method.returnType ===
            rule.returnType &&
            method.access ===
            rule.access
          );
        });

      if (!matchedMethod) {

        return {
          isMatch: false,
          message: `Tidak ditemukan overload method ${rule.name} dengan parameter [${rule.parameters.join(", ")}]`
        };
      }

      return {
        isMatch: true,
        message: `Method ${rule.name} valid`
      };
    }

    /**
     * =================================
     * EXTENDS
     * =================================
     */

    case "extends": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Child class ${rule.class} tidak ditemukan`
        };
      }

      if (
        target.superClass !==
        rule.parent
      ) {

        return {
          isMatch: false,
          message: `${rule.class} extends ${target.superClass}, expected ${rule.parent}`
        };
      }

      return {
        isMatch: true,
        message: `Extends relationship valid`
      };
    }

    /**
     * =================================
     * IMPLEMENTS
     * =================================
     */

    case "implements": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const implemented =
        target
        .implementedInterfaces
        .includes(
          rule.interface
        );

      if (!implemented) {

        return {
          isMatch: false,
          message: `${rule.class} tidak mengimplementasikan ${rule.interface}`
        };
      }

      return {
        isMatch: true,
        message: `Implements relationship valid`
      };
    }

    /**
     * =================================
     * OVERRIDE
     * =================================
     */

    case "override": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const method =
        target.methods.find(
          (m) =>
          m.name ===
          rule.method
        );

      if (!method) {

        return {
          isMatch: false,
          message: `Method ${rule.method} tidak ditemukan`
        };
      }

      if (!method.isOverride) {

        return {
          isMatch: false,
          message: `Method ${rule.method} tidak memiliki annotation @Override`
        };
      }

      return {
        isMatch: true,
        message: `Override valid`
      };
    }

    /**
     * =================================
     * OVERLOAD
     * =================================
     */

    case "overload": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const overloaded =
        target.overloadMethods.includes(
          rule.method
        );

      if (!overloaded) {

        return {
          isMatch: false,
          message: `Method ${rule.method} tidak overload`
        };
      }

      return {
        isMatch: true,
        message: `Overload valid`
      };
    }

    case "getter_setter": {

      const target =
        classes.find(
          (c) =>
          c.name ===
          rule.class
        );

      if (!target) {

        return {
          isMatch: false,
          message: `Class ${rule.class} tidak ditemukan`
        };
      }

      const attribute =
        target.attributes.find(
          (attr) =>
          attr.name ===
          rule.attribute
        );

      if (!attribute) {

        return {
          isMatch: false,
          message: `Attribute ${rule.attribute} tidak ditemukan`
        };
      }

      const {
        hasGetter,
        hasSetter,
      } = hasGetterSetter(
        target,
        attribute
      );

      if (!hasGetter) {

        return {
          isMatch: false,
          message: `Getter untuk attribute ${rule.attribute} tidak ditemukan`
        };
      }

      if (!hasSetter) {

        return {
          isMatch: false,
          message: `Setter untuk attribute ${rule.attribute} tidak ditemukan`
        };
      }

      return {
        isMatch: true,
        message: `Getter dan setter ${rule.attribute} valid`
      };
    }

    default:

      return {
        isMatch: false,
          message:
          `Unknown rule type ${rule.type}`
      };
  }
};

// Main Logic

export const compareCodeWithLogic = (fileArray, logicRulesRaw) => {

  try {

    let allClassesInfo = [];
    console.log("Logic Rules");
    console.log(logicRulesRaw.length);

    fileArray.forEach((file) => {

      if (!file.content ?.trim()) {
        return;
      }

      const extracted = analyzeJavaFile(file.content);

      allClassesInfo = [
        ...allClassesInfo,
        ...extracted,
      ];
    });

    const results =
      logicRulesRaw.map(
        (rule) => {
          const validation =
            validateRule(
              rule,
              allClassesInfo
            );

          return {
            rule,
            status: validation.isMatch ?
              "MATCH" :
              "MISMATCH",
            message: validation.message
          };
        }
      );
    // console.log(results);

    return {
      success: true,
      classes: allClassesInfo,
      results
    };

  } catch (err) {

    return {
      success: false,
      error: "PROCESSING_ERROR",
      message: err.message
    };
  }
};