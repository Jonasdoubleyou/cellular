import { Table } from "../table/Table";
import { QueryExecutor } from "./executor";
import { Predicate, SortPredicate, and, eq } from "./predicates";

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
    private constructor(readonly ops: Op[]) {}

    static from<Fields>(table: Table<Fields>): Query<Fields> {
        return new Query<Fields>([{
            type: "table",
            table
        }]);
    }

    filter(predicate: Predicate<Fields>): Query<Fields> {
        return new Query<Fields>([
            ...this.ops,
            { type: "filter", predicate }
        ])
    }

    sort(...order: SortPredicate<Fields>[]): Query<Fields> {
        return new Query<Fields>([
            ...this.ops,
            { type: "sort", order }
        ]);
    }

    run(): Table<Fields> {
        const executor = new QueryExecutor(this);
        executor.run()
        return executor.get();
    }
}
