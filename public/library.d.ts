declare module "model/variables" {
    export interface Type {
        base: "any" | "number" | "boolean" | "string" | "array" | "object";
        name?: string;
        namedSubTypes?: {
            name: string;
            type: Type;
        }[];
        subTypes?: Type[];
    }
    export interface Variable {
        name: string;
        type: Type;
    }
    export type VariableRecord = {
        [name: string]: any;
    };
    export const isNumber: (t: Type) => boolean;
    export const isBoolean: (t: Type) => boolean;
    export const isString: (t: Type) => boolean;
    export const isArray: (t: Type) => boolean;
    export const isObject: (t: Type) => boolean;
    export function isSame(a: Type, b: Type): boolean;
    export function isAssignableTo(source: Type, target: Type): boolean;
    export function isSubtype(source: Type, target: Type): boolean;
    export function typeToString(t: Type): string;
    export function toTypescript(t: Type): string;
    export function detectType(value: any, depth?: number): Type;
}
declare module "library/table/Column" {
    import { Type } from "model/variables";
    /** Just an immutable array with some utilities on top */
    export interface Column<RealType = any> {
        readonly type: Type;
        readonly name: string;
        get(index: number): RealType | never;
        size(): number;
    }
    export class ArrayColumn<RealType> implements Column<RealType> {
        readonly name: string;
        private values;
        type: Type;
        constructor(name: string, values: RealType[]);
        get(index: number): RealType | never;
        size(): number;
    }
    export class FilteredColumn<RealType> implements Column<RealType> {
        private base;
        private rows;
        readonly name: string;
        type: Type;
        constructor(base: Column<RealType>, rows: number[], name?: string);
        get(index: number): RealType;
        size(): number;
    }
}
declare module "library/query/expressions" {
    export type Field = string;
    export type Value = string | number | boolean;
}
declare module "library/query/predicates" {
    import { Field, Value } from "library/query/expressions";
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
    export interface SortPredicate<Fields> {
        field: Field;
        sort: "asc" | "desc";
    }
    export const asc: <Fields, AField extends keyof Fields & string>(field: AField) => SortPredicate<Fields>;
    export const desc: <Fields, AField extends keyof Fields & string>(field: AField) => SortPredicate<Fields>;
}
declare module "library/query/executor" {
    import { Table } from "library/table/Table";
    import { Query } from "library/query/query";
    export class QueryExecutor {
        private query;
        private tables;
        constructor(query: Query<any>);
        run(): void;
        get(): Table<any>;
    }
}
declare module "library/query/query" {
    import { Table } from "library/table/Table";
    import { Predicate, SortPredicate } from "library/query/predicates";
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
    interface SortOp {
        type: "sort";
        order: SortPredicate<any>[];
    }
    type Op = TableOp | FilterOp | ProjectOp | JoinOp | SortOp;
    export class Query<Fields> {
        readonly ops: Op[];
        private constructor();
        static from<Fields>(table: Table<Fields>): Query<Fields>;
        filter(predicate: Predicate<Fields>): Query<Fields>;
        sort(...order: SortPredicate<Fields>[]): Query<Fields>;
        run(): Table<Fields>;
    }
}
declare module "library/table/Table" {
    import { Type } from "model/variables";
    import { Query } from "library/query/query";
    import { Column } from "library/table/Column";
    /** Holds tabular data in columns. Columns can be found by name, all columns have the same number of rows.
     *  Tables are immutable. Use queries to build new tables from them
     *
     */
    export class Table<ColTypes> {
        private columnByName;
        readonly size: number;
        constructor(columns: Column[]);
        cols(): Column[];
        type(): Type;
        col<Name extends (keyof ColTypes & string) = any, ColType = ColTypes[Name]>(name: Name): Column<ColType>;
        query(): Query<ColTypes>;
        filterByRows(rows: number[]): Table<ColTypes>;
    }
}
declare module "library/index" {
    import * as Columns from "library/table/Column";
    import * as Tables from "library/table/Table";
    import * as Predicates from "library/query/predicates";
    export const library: {
        and: <Fields>(...preds: Predicates.Predicate<Fields>[]) => Predicates.And<Fields>;
        or: <Fields_1>(...preds: Predicates.Predicate<Fields_1>[]) => Predicates.Or<Fields_1>;
        eq: <Fields_2, AField extends keyof Fields_2 & string, AValue extends Fields_2[AField] & import("library/query/expressions").Value>(field: AField, value: AValue) => Predicates.Eq<Fields_2>;
        asc: <Fields_3, AField_1 extends keyof Fields_3 & string>(field: AField_1) => Predicates.SortPredicate<Fields_3>;
        desc: <Fields_4, AField_2 extends keyof Fields_4 & string>(field: AField_2) => Predicates.SortPredicate<Fields_4>;
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
        var asc: typeof Predicates.asc;
        var desc: typeof Predicates.desc;
    }
}
