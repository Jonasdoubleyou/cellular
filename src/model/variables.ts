// Describes Types of Values passed around in Cellular Models
// As Cellular mainly runs JavaScript, it's typesystem is rooted in in JS
// Also as JavaScript is dynamically typed, the type system is also very flexible
//
// Usually types are automatically inferred from runtime values - and values
// can provide a custom inference by providing a type(): Type method.
//
// To provide typing within the Script editor, Typescript declarations can be generated
// for Types 
export interface Type {
    // The basic shape - either a primitive, an object or an array
    // Equivalent to JavaScript's typeof
    // Anything can be assigned to values of type "any"
    base: "any" | "number" | "boolean" | "string" | "array" | "object";

    // For a objects, contains the name of the class, i.e. 'Table'
    // Objects with a name are called instances
    name?: string;

    // For instances, describes the generic parameter as an object
    // Equivalent to Typescript's generic (type.name)<{ (name): (type), ... }>
    //
    // For arrays, the only named sub type describes the type of all array elements
    // (to distinguish from tuples that would use "subTypes")
    //
    // For other objects, describes the properties of the object
    namedSubTypes?: { name: string, type: Type }[];

    // For instances, descibes a list of generic parameters
    // Equivalent to Typescript's (type.name)<subTypes...>
    //
    // For arrays, the n'th subType describes the type of the n'th array element (a tuple)
    subTypes?: Type[];
}

export interface Variable {
    name: string;
    type: Type;
}

// Runtime representation of a Set of Variables
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
        // TODO: Make independent of argument order
        const sameSubTypes = a.namedSubTypes.every(it => b.namedSubTypes!.some(other => it.name === other.name && isSame(it.type, other.type)));
        if (!sameSubTypes) return false;
    }

    if (a.subTypes) {
        if (!b.subTypes || a.subTypes.length !== b.subTypes.length) return false;
        if (!a.subTypes.every((it, i) => isSame(it, b.subTypes![i]))) return false;
    }

    return true;
}

export function isAssignableTo(source: Type, target: Type) {
    return isSubtype(source, target);
}

export function isSubtype(source: Type, target: Type) {
    if (target.base === "any") return true;
    
    // TODO: instance as subtype of object, generic as subtype of instance
    if (source.base === target.base && source.name === target.name) return true;
    
    return false;
}

// ---------------- Type Utilities --------------

// Short summary of a type to display in the UI
export function typeToString(t: Type) {
    return t.name ?? t.base;
}

// Render type to a string of Typescript
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
// This is always a "best effort" as it is sometimes hard to generalize
// i.e. tuples vs. array of supertype of all elements

// As objects can be arbitrarily nested, we only infer types to a certain depth
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