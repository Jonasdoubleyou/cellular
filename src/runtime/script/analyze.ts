import { parse } from "@babel/parser";
import { isInside, visit, Visitor } from "./traverse";
import { ScriptRuntimeBlock } from "../block";
import { Variable } from "../../model/variables";

export function isGlobalJS(variableName: string) {
    return variableName in window;
}

export function analyzeScript(script: string, runtimeBlock: ScriptRuntimeBlock) {
    const ast = parse(script, { annexB: false, attachComment: false, strictMode: true, errorRecovery: true });
    console.log(`Analzye Script`, ast);

    const knownInputVariables = new Set<string>(
        runtimeBlock.getInputVariables().map(it => it.name)
    );

    const knownOutputVariables = new Set<string>(
        runtimeBlock.getOutputVariables().map(it => it.name)
    );

    const localVariables = new Set<string>();
    const usedInputVariables = new Set<string>();
    const usedOutputVariables = new Set<string>();

    const unknownWrittenVariables = new Set<string>();
    const unknownReadVariables = new Set<string>();

    let insideDeclaration = isInside();
    let insideLeft = isInside();
    let insideMember = isInside();

    visit(ast, {
        VariableDeclarator: insideDeclaration,
        AssignmentExpression: { left: insideLeft },
        MemberExpression: { property: insideMember, },

        FunctionExpression: {
            enter(node) {
                for (const param of node.params) {
                    if (param.type === "Identifier") {
                        // function (local)
                        localVariables.add(param.name);
                    }
                }
            }
        },
        ArrowFunctionExpression: {
            enter(node) {
                for (const param of node.params) {
                    if (param.type === "Identifier") {
                        // (local) => ...
                        localVariables.add(param.name);
                    }
                }
            }
        },
        Identifier: {
            enter(node) {
                // a.b.c -> skip b and c, we only care about non members (= globals)
                if (insideMember.is) return;
                if (isGlobalJS(node.name)) return;

                if (insideDeclaration.is) {
                    // in: a
                    // const a <- conflicting declaration
                    if (knownInputVariables.has(node.name) || knownOutputVariables.has(node.name)) {
                        throw new Error(`Redeclaration of input or output '${node.name}'`);
                    }

                    // let a; const b; var c;
                    localVariables.add(node.name);
                    return;
                }

                if (localVariables.has(node.name)) return;

                // in a
                // console.log(a) <- input variable is actually used
                if (knownInputVariables.has(node.name)) {
                    usedInputVariables.add(node.name);
                    return;
                }

                if (insideLeft.is) {
                    if (unknownReadVariables.has(node.name)) {
                        throw new Error(`Variable '${node.name}' seems to be a global in/out variable, but it is read before it is written?`);
                    }

                    if (knownOutputVariables.has(node.name)) {
                        usedOutputVariables.add(node.name);
                        return;
                    }

                    unknownWrittenVariables.add(node.name);
                    return;
                }

                // out = 1
                // console.log(out); <- read after write of out variable
                if (unknownWrittenVariables.has(node.name)) return;

                // console.log(in) <- read only, has to be in variable?
                unknownReadVariables.add(node.name);
            }
        },
    });

    console.log("Local Variables", localVariables);
    console.log("Input Variables  / Known", knownInputVariables);
    console.log("                 / Used", usedInputVariables);
    console.log("Output Variables / Known", knownOutputVariables);
    console.log("                 / Used", usedOutputVariables);

    console.log("Unknown Variables / Read", unknownReadVariables);
    console.log("                  / Written", unknownWrittenVariables);

    if (unknownWrittenVariables.size) {
        const outputVariables: Variable[] = [...runtimeBlock.getOutputVariables()];

        for (const variable of unknownWrittenVariables.values()) {
            outputVariables.push({
                name: variable,
                type: { base: "any" }
            })
        }

        console.log("Assuming Determined Output Variables", outputVariables);

        runtimeBlock.setOutputVariables(outputVariables);
    }
    if (unknownReadVariables.size > 0) {
        const missing = runtimeBlock.runtime.rewireInputs(runtimeBlock, [...unknownReadVariables].map(name => ({ name, type: { base: "any" }})));
    }
}