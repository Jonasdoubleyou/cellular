export interface Type {
    base: "number" | "boolean" | "string" | "array" | "object";
    instanceOf?: any;
}

export interface Variable {
    name: string;
    type: Type;
}

export type VariableRecord =  {
    [name: string]: any;
};