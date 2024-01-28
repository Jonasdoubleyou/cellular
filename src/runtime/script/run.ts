import { library } from "../../library";
import { VariableRecord, detectType, isAssignableTo, isSubtype, typeToString } from "../../model/variables";
import { ScriptRuntimeBlock } from "../block";

interface RunResult {
    output: VariableRecord;
}

// Super hacky way to expose the library inside the script run:
Object.assign(globalThis, library);

export function runScript(script: string, input: VariableRecord, runtimeBlock: ScriptRuntimeBlock): RunResult {
    let body = "";

    body += "/* -------- INPUT ------------ */\n";
    for (const { name } of runtimeBlock.getInputVariables()) {
        if (!(name in input)) {
            throw new Error(`Missing input ${name}`);
        }

        body += `const { ${name} } = context.input;\n`;
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

    for (const outputVariable of runtimeBlock.getOutputVariables()) {
        if (!(outputVariable.name in result))
            throw new Error(`Missing output ${outputVariable.name}`);

        const value = result[outputVariable.name];
        const valueType = detectType(value);
        
        if (!isAssignableTo(valueType, /* to */ outputVariable.type)) {
            throw new Error(`Expected type ${typeToString(outputVariable.type)} but got ${typeToString(valueType)} for ${outputVariable.name}`);
        }

        if (isSubtype(valueType, /* of */ outputVariable.type)) {
            runtimeBlock.updateOutputVariable({
                name: outputVariable.name,
                type: valueType
            });

            console.log(`Detected Runtime type ${typeToString(valueType)} for Variable ${outputVariable.name} (replacing ${typeToString(outputVariable.type)})`);
        }
    }

    runtimeBlock.commitUpdates();

    return {
        output: result
    }
}