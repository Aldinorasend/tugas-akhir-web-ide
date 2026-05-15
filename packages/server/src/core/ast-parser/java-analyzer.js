import { parse } from "java-parser";

/**
 * =================================
 * HELPER
 * =================================
 */

const getIdentifier = (node) => {
  return node?.children?.Identifier?.[0]?.image || null;
};

/**
 * =================================
 * ACCESS MODIFIER
 * =================================
 */

const getAccessModifier = (modifiers) => {
  if (!modifiers || !Array.isArray(modifiers)) return "public";

  for (const modifier of modifiers) {
    const children = modifier.children;
    if (children.Private) return "private";
    if (children.Protected) return "protected";
    if (children.Public) return "public";
  }

  return "public";
};

/**
 * =================================
 * TYPE PARSER
 * =================================
 */

const getTypeName = (unannType) => {
  if (!unannType) return "void";

  const children = unannType.children;

  /**
   * REFERENCE TYPE
   */
  const referenceType =
    children?.unannReferenceType?.[0]
      ?.children?.unannClassOrInterfaceType?.[0]
      ?.children?.unannClassType?.[0];

  if (referenceType) {
    return getIdentifier(referenceType);
  }

  /**
   * PRIMITIVE TYPE
   */
  const primitiveNode =
    children?.unannPrimitiveType?.[0] ||
    children?.unannPrimitiveTypeWithOptionalDimsSuffix?.[0]
      ?.children?.unannPrimitiveType?.[0];

  const primitive = primitiveNode?.children;

  if (!primitive) return "void";

  if (
    primitive.numericType?.[0]
      ?.children?.integralType?.[0]
      ?.children?.Int
  ) {
    return "int";
  }

  if (
    primitive.numericType?.[0]
      ?.children?.floatingPointType?.[0]
      ?.children?.Float
  ) {
    return "float";
  }

  if (
    primitive.numericType?.[0]
      ?.children?.floatingPointType?.[0]
      ?.children?.Double
  ) {
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
 * ATTRIBUTE EXTRACTOR
 * =================================
 */

const extractAttribute = (fieldDecl) => {
  const variable =
    fieldDecl?.children
      ?.variableDeclaratorList?.[0]
      ?.children?.variableDeclarator?.[0];

  const fieldName =
    variable?.children
      ?.variableDeclaratorId?.[0]
      ?.children?.Identifier?.[0]
      ?.image;

  const fieldType = getTypeName(
    fieldDecl?.children?.unannType?.[0]
  );

  const modifiers = fieldDecl?.children?.fieldModifier;

  return {
    name: fieldName,
    type: fieldType,
    access: getAccessModifier(modifiers),
  };
};

/**
 * =================================
 * METHOD EXTRACTOR
 * =================================
 */

const extractMethod = (methodDecl) => {
  const header =
    methodDecl?.children
      ?.methodHeader?.[0]
      ?.children;

  if (!header) return null;

  const methodName =
    header?.methodDeclarator?.[0]
      ?.children?.Identifier?.[0]
      ?.image;

  const returnType = getTypeName(
    header?.result?.[0]
      ?.children?.unannType?.[0]
  );

  const modifiers =
    methodDecl?.children?.methodModifier ||
    methodDecl?.children?.interfaceMethodModifier;

  return {
    name: methodName,
    returnType,
    access: getAccessModifier(modifiers),
  };
};

/**
 * =================================
 * TYPE DECLARATION EXTRACTOR
 * =================================
 */

const extractTypeDeclaration = (
  typeDecl
) => {
  /**
   * CLASS
   */
  const classDecl =
    typeDecl?.children
      ?.classDeclaration?.[0]
      ?.children
      ?.normalClassDeclaration?.[0];

  /**
   * INTERFACE
   */
  const interfaceDecl =
    typeDecl?.children
      ?.interfaceDeclaration?.[0]
      ?.children
      ?.normalInterfaceDeclaration?.[0];

  if (!classDecl && !interfaceDecl) {
    return null;
  }

  const isInterface = !!interfaceDecl;

  /**
   * NAME
   */
  const nameNode = classDecl
    ? classDecl?.children
        ?.typeIdentifier?.[0]
    : interfaceDecl?.children
        ?.typeIdentifier?.[0];

  const name =
    nameNode?.children
      ?.Identifier?.[0]
      ?.image;

  /**
   * ABSTRACT
   */
  const isAbstract =
    typeDecl?.children
      ?.classModifier?.some(
        (m) =>
          m?.children?.Abstract
      ) || false;

  /**
   * EXTENDS
   */
  const superClass =
    classDecl?.children
      ?.classExtends?.[0]
      ?.children?.classType?.[0]
      ?.children?.Identifier?.[0]
      ?.image || null;

  const attributes = [];
  const methods = [];

  /**
   * =================================
   * CLASS BODY
   * =================================
   */
  if (classDecl) {
    const bodyDeclarations =
      classDecl?.children
        ?.classBody?.[0]
        ?.children
        ?.classBodyDeclaration || [];

    bodyDeclarations.forEach((body) => {
      const member =
        body?.children
          ?.classMemberDeclaration?.[0];

      if (!member) return;

      /**
       * FIELD
       */
      const fieldDecl =
        member?.children
          ?.fieldDeclaration?.[0];

      if (fieldDecl) {
        attributes.push(
          extractAttribute(fieldDecl)
        );
      }

      /**
       * METHOD
       */
      const methodDecl =
        member?.children
          ?.methodDeclaration?.[0];

      if (methodDecl) {
        const method =
          extractMethod(methodDecl);

        if (method) {
          methods.push(method);
        }
      }
    });
  }

  /**
   * =================================
   * INTERFACE BODY
   * =================================
   */
  if (interfaceDecl) {
    const interfaceMembers =
      interfaceDecl?.children
        ?.interfaceBody?.[0]
        ?.children
        ?.interfaceMemberDeclaration || [];

    interfaceMembers.forEach((member) => {
      const methodDecl =
        member?.children
          ?.interfaceMethodDeclaration?.[0];

      if (methodDecl) {
        const method =
          extractMethod(methodDecl);

        if (method) {
          methods.push(method);
        }
      }
    });
  }

  return {
    name,
    isInterface,
    isAbstract,
    superClass,
    attributes,
    methods,
  };
};

/**
 * =================================
 * ANALYZE FILE
 * =================================
 */

const analyzeJavaFile = (content) => {
  try {
    const cst = parse(content);

    const ordinaryUnit =
      cst?.children
        ?.ordinaryCompilationUnit?.[0];

    if (!ordinaryUnit) {
      return [];
    }

    const typeDeclarations =
      ordinaryUnit?.children
        ?.typeDeclaration || [];

    return typeDeclarations
      .map(extractTypeDeclaration)
      .filter(Boolean);
  } catch (err) {
    console.error(
      "Java Parse Error:",
      err.message
    );

    return [];
  }
};

/**
 * =================================
 * RULE PARSER
 * =================================
 */

const parseRuleString = (ruleStr) => {
  const cleanRule =
    ruleStr
      .trim()
      .replace(/\.$/, "");

  const match =
    cleanRule.match(
      /(\w+)\((.*)\)/
    );

  if (!match) {
    throw new Error(
      "Invalid Rule Format"
    );
  }

  return {
    type: match[1],
    params: match[2]
      .split(",")
      .map((p) => p.trim()),
  };
};

/**
 * =================================
 * VALIDATOR
 * =================================
 */

const validateRule = (
  rule,
  classes
) => {
  const [
    className,
    p2,
    p3,
    p4,
  ] = rule.params;

  const target = classes.find(
    (c) => c.name === className
  );

  if (!target) {
    return false;
  }

  switch (rule.type) {
    case "class":
      return (
        !target.isInterface &&
        !target.isAbstract
      );

    case "interface":
      return target.isInterface;

    case "abstract_class":
      return target.isAbstract;

    case "extends":
      return (
        target.superClass === p2
      );

    case "attribute":
      return target.attributes.some(
        (attr) =>
          attr.name === p2 &&
          attr.type === p3 &&
          attr.access === p4
      );

    case "method":
      return target.methods.some(
        (method) =>
          method.name === p2 &&
          method.returnType === p3 &&
          method.access === p4
      );

    default:
      return false;
  }
};

/**
 * =================================
 * MAIN FUNCTION
 * =================================
 */

export const compareCodeWithLogic = (
  fileArray,
  logicRulesRaw
) => {
  try {
    /**
     * VALIDATE INPUT
     */
    if (!Array.isArray(fileArray)) {
      throw new Error(
        "fileArray must be array"
      );
    }

    /**
     * NORMALIZE RULES
     */
    let logicRules = [];

    if (
      typeof logicRulesRaw ===
      "string"
    ) {
      logicRules =
        logicRulesRaw
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean);
    } else if (
      Array.isArray(logicRulesRaw)
    ) {
      logicRules =
        logicRulesRaw;
    } else {
      throw new Error(
        "logicRules must be string or array"
      );
    }

    /**
     * ANALYZE FILES
     */
    let allClassesInfo = [];

    fileArray.forEach((file) => {
      if (
        !file.content?.trim()
      ) {
        return;
      }

      const extracted =
        analyzeJavaFile(
          file.content
        );

      allClassesInfo = [
        ...allClassesInfo,
        ...extracted,
      ];
    });

    console.log(
      "ALL CLASSES:",
      JSON.stringify(
        allClassesInfo,
        null,
        2
      )
    );

    /**
     * VALIDATE RULES
     */
    const results =
      logicRules.map(
        (rule) => {
          try {
            const parsedRule =
              parseRuleString(
                rule
              );

            const isMatch =
              validateRule(
                parsedRule,
                allClassesInfo
              );

            return {
              rule,
              status:
                isMatch
                  ? "MATCH"
                  : "MISMATCH",
            };
          } catch (err) {
            return {
              rule,
              status: "ERROR",
              message:
                err.message,
            };
          }
        }
      );

    return {
      success: true,
      classes: allClassesInfo,
      results,
      debug: {
        totalFiles:
          fileArray.length,
        totalRules:
          logicRules.length,
        classesFound:
          allClassesInfo.map(
            (c) => c.name
          ),
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        "Processing Error",
      message:
        err.message,
    };
  }
};