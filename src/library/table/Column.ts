
/** Just an immutable array with some utilities on top */
export interface Column<Type = any> {
    readonly name: string;
    get(index: number): Type | never;
    size(): number;
}

export class ArrayColumn<Type> implements Column {
    constructor(readonly name: string, private values: Type[]) {}

    get(index: number): Type | never {
        if (index < 0 || index >= this.values.length) {
            throw new Error(`Index out of bounds`);
        }

        return this.values[index];
    }

    size() { return this.values.length; }
}

export class FilteredColumn<Type> implements Column<Type> {
    constructor(private base: Column<Type>, private rows: number[], readonly name: string = base.name) {}
    
    get(index: number): Type {
        if (index < 0 || index >= this.rows.length) {
            throw new Error(`Index out of bounds`);
        }

        return this.base.get(this.rows[index]);
    }

    size() {
        return this.rows.length;
    }
}