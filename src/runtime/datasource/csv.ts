import { Column, ArrayColumn } from "../../library/table/Column";
import { detectType } from "../../model/variables";
import type { FileInfo } from "./datasource";
import Papa from "papaparse";

export function parseCSV(fileContent: ArrayBuffer): FileInfo {
    const parsed = Papa.parse((new TextDecoder()).decode(fileContent), { header: true });
    
    const columns: Column[] = [];

    for (const field of parsed.meta.fields!) {
        const values = parsed.data.map(row => (row as any)[field]);
        columns.push(new ArrayColumn(field, values));
    }

    const table = new Table(columns);

    return {
        type: detectType(table),
        data: table,
        summary: `CSV - ${parsed.meta!.fields?.join(", ")} (${parsed.data.length} lines)`
    };
}