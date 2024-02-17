import type { FileInfo } from "./datasource";

export function parseCSV(fileContent: ArrayBuffer): FileInfo {
    return {
        type: { base: "any" },
        data: "TODO"
    }
}