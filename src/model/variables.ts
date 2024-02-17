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

export function toTypescript(t: Type): string {
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

    if (t.base === "object" && t.namedSubTypes && t.namedSubTypes.length > 0) {
        let result = `{`;

        for (const sub of t.namedSubTypes)
            result += `${sub.name}: ${toTypescript(sub.type)}, `;
        
        result += `}`;
        return result;
    }

    if (t.base === "array" && t.namedSubTypes && t.namedSubTypes.length === 1) {
        return `${toTypescript(t.namedSubTypes![0].type)}[]`;
    }

    return t.base;
}


// ---------------- Type Detection --------------------------
// Infers Cellular Types from JavaScript types

const MAX_DEPTH = 5;

export function detectType(value: any, depth = 0): Type {
    switch (typeof value) {
        case "number":
        case "bigint":
            return { base: "number" };
        case "string":
            return { base: "string" };
        case "boolean":
            return { base: "boolean" };
        case "object":
            return detectObjectType(value, depth);
        default:
            return { base: "any" };
    }
}

const MAX_KEYS = 100;

function detectObjectType(value: object, depth = 0): Type {
    if (Array.isArray(value)) {
        return detectArrayType(value, depth);
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

    const entries = Object.entries(value);
    if (entries.length < MAX_KEYS && depth < MAX_DEPTH) {
        const result: Type = { base: "object", namedSubTypes: [] };
        for (const [k, v] of entries) {
            result.namedSubTypes!.push({
                type: detectType(v, depth + 1),
                name: k
            });
        }

        return result;
    }

    return { base: "object" };
}

function detectArrayType(value: any[], depth = 0): Type {
    if (value.length > 0 && depth < MAX_DEPTH) {
        const type = detectType(value[0], depth + 1);
        return { base: "array", namedSubTypes: [{ name: "", type }]};
    }

    return { base: "array" };
}