import * as Columns from "./table/Column";
import * as Tables from "./table/Table";
import * as Predicates from  "./query/predicates";

export const library = {
    ...Columns, ...Tables, ...Predicates
};

// Makes the library available as globals
declare global {
    var ArrayColumn: typeof Columns.ArrayColumn;
    var FilteredColumn: typeof Columns.FilteredColumn;
    var Table: typeof Tables.Table;
    var eq: typeof Predicates.eq;
    var and: typeof Predicates.and;
    var or: typeof Predicates.or;

    var test: Tables.Table<{ a: string, b: number }>;
}
