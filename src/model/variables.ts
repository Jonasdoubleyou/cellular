export interface Type {
    // The basic shape - either a primitive, an object or an array
    base: "any" | "number" | "boolean" | "string" | "array" | "object";
    // For a class instance, contains the name of the class, i.e. 'Table'
    name?: string;
    // For generic types, either contains their generic arguments
    namedSubTypes?: { name: string, type: Type }[];
    subTypes?: Type[];
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
    if (a.base !== b.base) return false;
    if (a.name !== b.name) return false;

    if (a.namedSubTypes) {
        if (!b.namedSubTypes) return false;
        const sameSubTypes = a.namedSubTypes.every(it => b.namedSubTypes!.some(other => it.name === other.name && isSame(it.type, other.type)));
        if (!sameSubTypes) return false;
    }

    return true;
}

export function isAssignableTo(source: Type, target: Type) {
    return target.base === "any" || isSame(source, target);
}

export function isSubtype(source: Type, target: Type) {
    return target.base === "any";
}

// ---------------- Type Utilities --------------

export function typeToString(t: Type) {
    return t.name ?? t.base;
}

export function toTypescript(t: Type) {
    if(t.name) {
        let result = t.name;

        if (t.namedSubTypes) {
            result += `<{`;
            for (const { name, type } of t.namedSubTypes!) {
                result += `${name}: ${toTypescript(type)}, `;
            }
            result += `}>`;
        } else if (t.subTypes) {
            result += `<`;
            for (const type of t.subTypes) {
                result += `${toTypescript(type)}, `;
            }
            result += `>`;
        }
        
        return result;
    }

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

    // Runtime objects might provide 'runtime types'
    // i.e. table.type() returns { name: "Table", namedSubTypes: [{ name: "colA", type: { base: "string"} }]}
    //  then we can infer the type Table<{ colA: string }>
    if ("type" in value && value.type instanceof Function) {
        return value.type() as Type;
    }

    if ("type" in value) {
        return value.type as Type;
    }

    return { base: "object" };
}