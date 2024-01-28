declare module "table/Column" {
    /** Just an immutable array with some utilities on top */
    export interface Column<Type = any> {
        readonly name: string;
        get(index: number): Type | never;
        size(): number;
    }
    export class ArrayColumn<Type> implements Column {
        readonly name: string;
        private values;
        constructor(name: string, values: Type[]);
        get(index: number): Type | never;
        size(): number;
    }
    export class FilteredColumn<Type> implements Column<Type> {
        private base;
        private rows;
        readonly name: string;
        constructor(base: Column<Type>, rows: number[], name?: string);
        get(index: number): Type;
        size(): number;
    }
}
declare module "query/expressions" {
    export type Field = string;
    export type Value = string | number | boolean;
}
declare module "query/predicates" {
    import { Field, Value } from "query/expressions";
    export interface And<Fields> {
        type: "and";
        preds: Predicate<Fields>[];
    }
    export const and: <Fields>(...preds: Predicate<Fields>[]) => And<Fields>;
    export interface Or<Fields> {
        type: "or";
        preds: Predicate<Fields>[];
    }
    export const or: <Fields>(...preds: Predicate<Fields>[]) => Or<Fields>;
    export interface Eq<Fields> {
        type: "eq";
        field: Field;
        value: Value;
    }
    export const eq: <Fields, AField extends keyof Fields & string, AValue extends Fields[AField] & Value>(field: AField, value: AValue) => Eq<Fields>;
    export type Predicate<Fields> = And<Fields> | Or<Fields> | Eq<Fields>;
}
declare module "query/executor" {
    import { Table } from "table/Table";
    import { Query } from "query/query";
    export class QueryExecutor {
        private query;
        private tables;
        constructor(query: Query<any>);
        run(): void;
        get(): Table<any>;
    }
}
declare module "query/query" {
    import { Table } from "table/Table";
    import { Predicate } from "query/predicates";
    interface TableOp {
        type: "table";
        table: Table<any>;
    }
    interface FilterOp {
        type: "filter";
        predicate: Predicate<any>;
    }
    interface ProjectOp {
        type: "projection";
    }
    interface JoinOp {
        type: "join";
    }
    type Op = TableOp | FilterOp | ProjectOp | JoinOp;
    export class Query<Fields> {
        readonly ops: Op[];
        private constructor();
        static from<Fields>(table: Table<Fields>): Query<Fields>;
        filter(predicate: Predicate<Fields>): Query<Fields>;
        run(): Table<Fields>;
    }
}
declare module "table/Table" {
    import { Query } from "query/query";
    import { Column } from "table/Column";
    /** Holds tabular data in columns. Columns can be found by name, all columns have the same number of rows.
     *  Tables are immutable. Use queries to build new tables from them
     *
     */
    export class Table<ColTypes> {
        private columnByName;
        constructor(columns: Column[]);
        col<Name extends (keyof ColTypes & string) = any, ColType = ColTypes[Name]>(name: Name): Column<ColType>;
        query(): Query<ColTypes>;
        filter(rows: number[]): Table<ColTypes>;
    }
}
declare module "index" {
    import * as Columns from "table/Column";
    import * as Tables from "table/Table";
    import * as Predicates from "query/predicates";
    export const library: {
        and: <Fields>(...preds: Predicates.Predicate<Fields>[]) => Predicates.And<Fields>;
        or: <Fields_1>(...preds: Predicates.Predicate<Fields_1>[]) => Predicates.Or<Fields_1>;
        eq: <Fields_2, AField extends keyof Fields_2 & string, AValue extends Fields_2[AField] & import("query/expressions").Value>(field: AField, value: AValue) => Predicates.Eq<Fields_2>;
        Table: typeof Tables.Table;
        ArrayColumn: typeof Columns.ArrayColumn;
        FilteredColumn: typeof Columns.FilteredColumn;
    };
    global {
        var ArrayColumn: typeof Columns.ArrayColumn;
        var FilteredColumn: typeof Columns.FilteredColumn;
        const Table: typeof Tables.Table;
        type Table<T> = Tables.Table<T>;
        var eq: typeof Predicates.eq;
        var and: typeof Predicates.and;
        var or: typeof Predicates.or;
    }
}
