import type { Runtime } from ".";
import { Block, BlockID, BlockInput, DataSourceBlock, ScriptBlock, VisualizeBlock } from "../model/block";
import { Type, Variable, VariableRecord, isAssignableTo, isSame } from "../model/variables";
import { provideTypes } from "../ui/script/code";
import { analyzeScript } from "./script/analyze";
import { runScript } from "./script/run";
import { getFileInfo } from "./datasource/datasource";
import { File } from "./filestore";

export type RunResult = { at: number, variables: VariableRecord | null, errors: Error[] };
type OnRunHandler = (runResult: RunResult) => void;
type InputChangeHandler = (input: VariableRecord) => void;

export abstract class RuntimeBlock<BlockType extends Block = Block> {
    blockID: BlockID;
    runtime: Runtime;

    calculatedOutput: Variable[] | null = null;

    lastChangedAt: number | null = null;
    
    lastRunResult: RunResult | null = null;

    runHandlers: OnRunHandler[] = [];
    onRun(handler: OnRunHandler) {
        this.runHandlers.push(handler);

        return () => { this.runHandlers = this.runHandlers.filter(it => it !== handler) };
    }

    inputHandlers: InputChangeHandler[] = [];
    onInputChange(handler: InputChangeHandler) {
        this.inputHandlers.push(handler);

        return () => { this.inputHandlers = this.inputHandlers.filter(it => it !== handler)};
    }

    async notifyInputChange() {
        if (this.inputHandlers.length === 0) return;

        const input = await this.getInput();
        for (const handler of this.inputHandlers) handler(input);
    }
    
    getBlock() {
        return this.runtime.getBlock(this.blockID) as Readonly<BlockType>;
    }

    constructor(blockID: BlockID, runtime: Runtime) {
        this.blockID = blockID;
        this.runtime = runtime;
    }

    update(update: Partial<BlockType>) {
        try {
            update = this.executeUpdate(update);
            this.lastChangedAt = Date.now();
            this.runtime._updateBlock(this.getBlock(), update);
        } catch(error) {
            console.log(`Error while updating Block(${this.blockID})`, error);
            const updateResult: RunResult = { at: Date.now(), errors: [error as Error], variables: null };
            this.lastRunResult = updateResult;

            for (const handler of this.runHandlers) {
                handler(updateResult);
            }
        }
    }

    protected abstract executeUpdate(update: Partial<BlockType>): Partial<BlockType>;

    hasValidResult() {
        return this.lastRunResult && (!this.lastChangedAt || this.lastChangedAt <= this.lastRunResult.at);
    }

    async getInput(): Promise<VariableRecord> {
        console.log(`${this.blockID} - Calculating Input`);

        const result: VariableRecord = {};
        for (const input of this.getBlock().inputs) {
            const inputBlock = this.runtime.getRuntimeBlock(input.blockID);
            const inputVariables = (await inputBlock.getOutput()).variables;
            if (inputVariables == null) {
                throw new Error(`Could not get Input from Block(${inputBlock.blockID})`);
            }
            for (const [name, value] of Object.entries(inputVariables)) {
                if (!input.variables.includes(name)) continue;

                if (name in result) {
                    throw new Error(`Input Variable collision of '${name}'`);
                }
                result[name] = value;
            }
        }

        console.log(`${this.blockID} - Calculated Input`, result);

        return result;
    }

    getInputVariables(): Readonly<Variable>[] {
        const result = [];
        for (const input of this.getBlock().inputs) {
            const itsOutput = this.runtime.getRuntimeBlock(input.blockID).getBlock().output;
            for (const name of input.variables) {
                const variable = itsOutput.find(it => it.name === name);
                if (!variable) {
                    throw new Error(`Missing Variable '${name}', Block ${this.blockID} expected it to be an output of Block ${input.blockID}`);
                }

                result.push(variable);
            }
        }

        return result;
    }

    getPotentialInputs(type?: Type) {
        const result: { blockID: string, variable: Variable }[] = [];

        for (const input of this.runtime.getStore().getAllInputVariables(this.getBlock())) {
            if (!type || isAssignableTo(input.variable.type, /* to */ type)) {
                result.push(input);
            }
        }

        return result;
    }

    setInput(inputs: BlockInput[]) {
        this.update({ inputs } as any);
        this.notifyInputChange();
    }

    getOutputVariables(): Readonly<Readonly<Variable>[]> {
        return this.calculatedOutput ?? this.getBlock().output;
    }

    setOutputVariables(calculatedOutput: Variable[]) {
        this.calculatedOutput = calculatedOutput;
        provideTypes(this.blockID, this.calculatedOutput);
    }

    updateOutputVariable(it: Variable) {
        if (!this.calculatedOutput) this.calculatedOutput = this.getBlock().output;

        const toUpdate = this.calculatedOutput.findIndex(t => t.name === it.name);
        if (toUpdate === -1) {
            throw new Error(`Cannot update Variable ${it.name} as it is not present in the output variables`);
        }

        this.calculatedOutput[toUpdate] = it;
        provideTypes(this.blockID, this.calculatedOutput);
    }

    // After a RuntimeBlock was run, we might know some changes to the model (observed at runtime),
    // which we propagate to the model
    commitUpdates() {
        if (!this.calculatedOutput) return;

        this.runtime.updateBlock(this.getBlock(), {
            output: this.calculatedOutput,
        });

        this.calculatedOutput = null;
        console.log("Commited Model Updates");
    }

    async getOutput(): Promise<VariableRecord> {
        if (this.hasValidResult()) {
            console.log(`${this.blockID} - Returning cached Output`, this.lastRunResult);
            return this.lastRunResult!;
        }

        const result: RunResult = { at: Date.now(), variables: null, errors: [] };
        try {
            console.log(`${this.blockID} - Computing Input`);

            const input = await this.getInput();
            console.log(`${this.blockID} - Computed Input`);

            result.variables = await this.execute(input);
            this.lastRunResult = result;

            console.log(`${this.blockID} - Computed Output`, result);
        } catch (error) {
            console.log(`Error while computing output of Block(${this.blockID})`, error);
            result.errors.push(error as Error);
        }

        for (const handler of this.runHandlers) {
            handler(result);
        }

        this.runtime.notifyOutputChange(this.getBlock());

        return result;
    }

    protected abstract execute (input: VariableRecord): Promise<VariableRecord>;

    static create(block: Block, runtime: Runtime): RuntimeBlock<Block> | null {
        if (block.type === "javascript") {
            return new ScriptRuntimeBlock(block.blockID, runtime);
        }

        if (block.type === "datasource") {
            return new DatasourceRuntimeBlock(block.blockID, runtime);
        }

        if (block.type === "visualize") {
            return new VisualizeRuntimeBlock(block.blockID, runtime);
        }

        return null;
    }
}

export class ScriptRuntimeBlock extends RuntimeBlock<ScriptBlock> {
    executeUpdate(update: Partial<ScriptBlock>): Partial<ScriptBlock> {
        if (update.script) {
            analyzeScript(update.script, this);
        }

        return update;
    }
    async execute(input: VariableRecord): Promise<VariableRecord> {
        const result = runScript(this.getBlock().script, input, this);
        return result.output;
    }
}


class DatasourceRuntimeBlock extends RuntimeBlock<DataSourceBlock> {
    executeUpdate(update: Partial<DataSourceBlock>): Partial<DataSourceBlock> {
        throw new Error("Method not implemented.");
    }
    async execute(): Promise<VariableRecord> {
        const { name, sourcetype, path } = this.getBlock();
        const { data, type } = await getFileInfo(File.fromFullPath(path), this.runtime.workspace.getFiles());
        
        if (!isSame(type, this.getOutputVariables()[0].type)) {
            throw new Error(`Type missmatch between data source type and parsed result of file`);
        }

        return {
            [name]: data,
        };
    }
}


class VisualizeRuntimeBlock extends RuntimeBlock<VisualizeBlock> {
    executeUpdate(update: Partial<VisualizeBlock>): Partial<VisualizeBlock> {
        return update;
    }
    async execute(input: VariableRecord): Promise<VariableRecord> {
        // TODO : Calculate visual

        return { /* no output */ };
    }
}