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
    const Table: typeof Tables.Table;
    type Table<T> = Tables.Table<T>;
    
    var eq: typeof Predicates.eq;
    var and: typeof Predicates.and;
    var or: typeof Predicates.or;
}
