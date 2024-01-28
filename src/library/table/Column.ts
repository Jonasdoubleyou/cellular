import { Type, detectType } from "../../model/variables";

/** Just an immutable array with some utilities on top */
export interface Column<RealType = any> {
    readonly type: Type;
    readonly name: string;
    get(index: number): RealType | never;
    size(): number;
}

export class ArrayColumn<RealType> implements Column<RealType> {
    type: Type = { base: "any" };
    constructor(readonly name: string, private values: RealType[]) {
        if (values.length > 0)
            this.type = detectType(values[0]); 
    }

    get(index: number): RealType | never {
        if (index < 0 || index >= this.values.length) {
            throw new Error(`Index out of bounds`);
        }

        return this.values[index];
    }

    size() { return this.values.length; }
}

export class FilteredColumn<RealType> implements Column<RealType> {
    type: Type;

    constructor(private base: Column<RealType>, private rows: number[], readonly name: string = base.name) {
        this.type = base.type;
    }
    
    get(index: number): RealType {
        if (index < 0 || index >= this.rows.length) {
            throw new Error(`Index out of bounds`);
        }

        return this.base.get(this.rows[index]);
    }

    size() {
        return this.rows.length;
    }
}