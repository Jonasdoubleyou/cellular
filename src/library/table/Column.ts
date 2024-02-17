import { Type, detectType } from "../../model/variables";

type Sorter = (idxA: number, idxB: number) => number;

class BaseColumn<RealType> {
    sorter(): Sorter {
        const self  = (this as any as Column<RealType>);
        
        if (self.type.base === "number") {
            return (idxA: number, idxB: number) => ((self.get(idxA) as number) - (self.get(idxB) as number));
        }

        return (idxA: number, idxB: number) => ((self.get(idxA)?.toString() ?? "").localeCompare((self.get(idxB)?.toString() ?? "")));
    
    }
    // Sorts the column values ascendingly and returns a new column
    sorted(): Column<RealType> {
        const self  = (this as any as Column<RealType>);
        const indices = Array.from({ length: self.size() }, (_, i) => i);
        indices.sort(this.sorter());

        return new FilteredColumn(self, indices);
    }
        
    // Returns the column as an array - This might just expose the
    // underlying buffer of the column - DO NOT WRITE IT!
    toArray(): readonly RealType[] {
        const self  = (this as any as Column<RealType>);
        
        const result: RealType[] = [];
        for (let i = 0; i < self.size(); i++) {
            result[i] = self.get(i);
        }

        return result;
    }
}

/** Just an immutable array with some utilities on top */
export interface Column<RealType = any> extends BaseColumn<RealType> {
    readonly type: Type;
    readonly name: string;
    get(index: number): RealType | never;
    size(): number;
}





export class ArrayColumn<RealType> extends BaseColumn<RealType> implements Column<RealType> {
    type: Type = { base: "any" };
    constructor(readonly name: string, private values: RealType[]) {
        super();
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

export class FilteredColumn<RealType> extends BaseColumn<RealType> implements Column<RealType> {
    type: Type;

    constructor(private base: Column<RealType>, private rows: number[], readonly name: string = base.name) {
        super();
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

export class ExpressionColumn<RealType, BaseType> extends BaseColumn<RealType> implements Column<RealType> {
    name: string;

    constructor(private base: Column<BaseType>, name: string, readonly type: Type, private expression: (base: BaseType, index: number) => RealType) {
        super();
        this.name = base.name + "<" + name + ">";
    }

    get(index: number): RealType {
        return this.expression(this.base.get(index), index);
    }

    size(): number {
        return this.base.size();
    }
}