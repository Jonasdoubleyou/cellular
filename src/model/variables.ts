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