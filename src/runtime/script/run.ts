import { VariableRecord } from "../../model/variables";
import { ScriptRuntimeBlock } from "../block";

interface RunResult {
    output: VariableRecord;
}

export function runScript(script: string, input: VariableRecord, runtimeBlock: ScriptRuntimeBlock): RunResult {
    let body = "";

    body += "/* -------- INPUT ------------ */\n";
    for (const input of runtimeBlock.getInputVariables()) {
        body += `const { ${input.name} } = context.input;\n`;
    }

    body += "/* -------- OUTPUT ----------- */\n";
    for (const output of runtimeBlock.getOutputVariables()) {
        body += `let ${output.name} = undefined;\n`;
    }

    body += "/* -------- BODY --------------- */\n";
    body += script;
    
    body += "\n/* -------- COLLECT OUTPUT ----- */\n";
    body += `return { `;
    for (const output of runtimeBlock.getOutputVariables()) {
        body += `${output.name}, `;
    }
    body += `};`;

    const fn = new Function("context", body);
    console.log("runScript constructed function", body);

    const context = {
        input,
    };

    console.log("Running function with context", context);
    const result = fn(context);
    console.log("Running function produced result", result)

    return {
        output: result
    }
}