import { Column } from "../table/Column";
import { Table } from "../table/Table";
import { Predicate } from "./predicates";
import { Query } from "./query";

// From sorted values, produces an intersection (also sorted)
function sortedIntersect(values: number[][]): number[] {
    if (values.length === 0) {
        return [];
    }

    if (values.length === 1) {
        return values[0]
    }

    const result = [];
    const [head, ...tails] = values;
    let tailIndices = tails.map(() => 0);

    scanner: for (const val of head) {
        for (const [idx, tail] of tails.entries()) {
            while(tailIndices[idx] < tail.length && val < tail[tailIndices[idx]]) tailIndices[idx] += 1;
            if (tailIndices[idx] >= tail.length) break scanner;

            if (val !== tail[tailIndices[idx]])
                continue scanner;
        }

        result.push(val);
    }

    return result;
}

// From sorted values, produces a union (also sorted)
function sortedUnion(values: number[][]): number[] {
    if (values.length === 0) {
        return [];
    }

    if (values.length === 1) {
        return values[0]
    }

    // TODO: Smarter implementation
    const result = new Set<number>();
    for (const it of values)
        for (const v of it)
            result.add(v);
    return [...result].sort((a, b) => a - b);
}

function scan(col: Column<any>, value: any) {
    const result: number[] = [];

    const size = col.size();
    for (let row = 0; row < size; row += 1) {
        if (col.get(row) === value)
            result.push(row);
    }

    return result;
}

function filter(table: Table<any>, predicate: Predicate<any>): Table<any> {
    function apply(predicate: Predicate<any>): number[] {
        switch(predicate.type) {
            case "and":
                return sortedIntersect(predicate.preds.map(apply));
            case "or":
                return sortedUnion(predicate.preds.map(apply));
            case "eq":
                return scan(table.col(predicate.field), predicate.value);
        }
    }

    return table.filter(apply(predicate));
}

export class QueryExecutor {
    private tables: Table<any>[] = [];

    constructor(private query: Query<any>) {}

    run() {
        for (const op of this.query.ops) {
            switch(op.type) {
                case "table":
                    this.tables.push(op.table);
                    break;

                case "filter":
                    if (this.tables.length < 1) throw new Error(`Missing input for filter`);
                    this.tables[0] = filter(this.tables[0], op.predicate);
                    break;
                
                case "join":
                    // TODO
                    break;
                
                case "projection":
                    // TODO
                    break;
            }
        }
    }

    get() {
        if (this.tables.length !== 1) {
            throw new Error(`Wrong number of result tables`);
        }

        return this.tables[0];
    }
}