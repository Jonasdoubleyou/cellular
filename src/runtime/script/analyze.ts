import type { Runtime } from "..";
import { parse } from "@babel/parser";

// Polyfill for traverse
import { Buffer } from "buffer";
window.Buffer = Buffer;

import traverse from "@babel/traverse";

export function analyzeScript(script: string, runtime: Runtime) {
    const ast = parse(script, { annexB: false, attachComment: false, strictMode: true, errorRecovery: true });
    console.log(`Analzye Script`, ast);

    traverse(ast, {
        AssignmentExpression: {
            enter(path, node) {
                console.log("AssignmentExpression", node);
            }
        },

        Identifier: {
            enter(path, node) {
                console.log("Identifier");
            }
        }
    })
}