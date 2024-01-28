import { Table } from "../table/Table";
import { QueryExecutor } from "./executor";
import { Predicate, and, eq } from "./predicates";

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

    run(): Table<Fields> {
        const executor = new QueryExecutor(this);
        executor.run()
        return executor.get();
    }
}
