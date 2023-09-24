export interface Type {
    base: "any" | "number" | "boolean" | "string" | "array" | "object";
    instanceOf?: any;
}

export interface Variable {
    name: string;
    type: Type;
}

export type VariableRecord =  {
    [name: string]: any;
};

// ------------- Type Equality --------------

export const isNumber = (t: Type) => t.base === "number";
export const isBoolean = (t: Type) => t.base === "boolean";
export const isString = (t: Type) => t.base === "string";
export const isArray = (t: Type) => t.base === "array";
export const isObject = (t: Type) => t.base === "object";

export function isSame(a: Type, b: Type) {
    return a.base === b.base;
}

export function isAssignableTo(source: Type, target: Type) {
    return target.base === "any" || isSame(source, target);
}

export function isSubtype(source: Type, target: Type) {
    return isAssignableTo(source, target) && source.base !== target.base;
}

// ---------------- Type Utilities --------------

export function typeToString(t: Type) {
    return t.base;
}



// ---------------- Type Detection --------------------------
// Infers Cellular Types from JavaScript types

export function detectType(value: any): Type {
    switch (typeof value) {
        case "number":
        case "bigint":
            return { base: "number" };
        case "string":
            return { base: "string" };
        case "boolean":
            return { base: "boolean" };
        case "object":
            return detectObjectType(value);
        default:
            return { base: "any" };
    }
}

function detectObjectType(value: object): Type {
    if (Array.isArray(value)) {
        return { base: "array" };
    }

    return { base: "object" };
}