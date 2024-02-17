import { detectType, toTypescript } from "../../model/variables";
import type { FileInfo } from "./datasource";

export function parseJSON(fileContent: ArrayBuffer): FileInfo {
    const data = JSON.parse(new TextDecoder().decode(fileContent));
    const type = detectType(data);
    console.log("JSON detectObjectType", data, type, toTypescript(type));

    // TODO: Rewrite to Table if array of objects
    return { type, data };
}
