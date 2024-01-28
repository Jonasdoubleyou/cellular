import { Type } from "../../model/variables";
import { Query } from "../query/query";
import { Column, FilteredColumn } from "./Column";

/** Holds tabular data in columns. Columns can be found by name, all columns have the same number of rows.
 *  Tables are immutable. Use queries to build new tables from them
 *  
 */

export class Table<ColTypes> {
    private columnByName = new Map<string, Column>();

    constructor(columns: Column[]) {
        for (const col of columns) {
            this.columnByName.set(col.name, col);
        }
    }

    cols(): Column[] { return [...this.columnByName.values()]; };

    type(): Type { 
        return { base: "object", name: "table", namedSubTypes: this.cols().map(it => ({ name: it.name, type: it.type })) };
    }

    col<Name extends (keyof ColTypes & string) = any, ColType = ColTypes[Name]>(name: Name): Column<ColType> {
        const col = this.columnByName.get(name);
        if (!col) throw new Error(`Unknown Column '${name}'`);
        return col;
    }

    query(): Query<ColTypes> { return Query.from(this); }

    filter(rows: number[]): Table<ColTypes> {
        return new Table(
            [...this.columnByName.values()]
            .map(it => new FilteredColumn(it, rows))
        );
    }
}