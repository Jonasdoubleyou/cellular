import React from "react";
import { Table } from "../../library/table/Table";

const ROW_LIMIT = 100;

export function TableUI({ table }: { table: Table<any> }) {
    const rows: React.ReactElement[] = [];
    const cols = table.cols();

    const maxRows = Math.min(table.size, ROW_LIMIT)
    for (let i = 0; i < maxRows; i++) {
        rows.push(
            <tr>
                {cols.map(col => <td>{col.get(i)}</td>)}
            </tr>
        )
    }

    if (table.size > ROW_LIMIT) {
        rows.push(<tr>
            {cols.map(() => <td>...</td>)}
        </tr>)
    }

    return (
        <table>
            <tr>
                {cols.map(it => <th>{it.name}</th>)}
            </tr>
            {rows}
        </table>
    )
}