import type { Runtime } from ".";
import { Block, BlockID, DataSourceBlock, ScriptBlock, VisualizeBlock } from "../model/block";
import { Variable, VariableRecord } from "../model/variables";
import { analyzeScript } from "./script/analyze";
import { runScript } from "./script/run";

export type RunResult = { at: number, variables: VariableRecord };
type OnRunHandler = (runResult: RunResult) => void;

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

    getBlock() {
        return this.runtime.getBlock(this.blockID) as Readonly<BlockType>;
    }

    constructor(blockID: BlockID, runtime: Runtime) {
        this.blockID = blockID;
        this.runtime = runtime;
    }

    update(update: Partial<BlockType>) {
        this.lastChangedAt = Date.now();
        update = this.executeUpdate(update);
        this.runtime._updateBlock(this.getBlock(), update);
    }

    protected abstract executeUpdate(update: Partial<BlockType>): Partial<BlockType>;

    hasValidResult() {
        return this.lastRunResult && (!this.lastChangedAt || this.lastChangedAt < this.lastRunResult.at);
    }

    async getInput(): Promise<VariableRecord> {
        console.log(`${this.blockID} - Calculating Input`);

        const result: VariableRecord = {};
        for (const input of this.getBlock().inputs) {
            const inputBlock = this.runtime.getRuntimeBlock(input.blockID);
            const inputVariables = await inputBlock.getOutput();
            for (const [name, value] of Object.entries(inputVariables)) {
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

    getOutputVariables(): Readonly<Readonly<Variable>[]> {
        return this.calculatedOutput ?? this.getBlock().output;
    }

    setOutputVariables(calculatedOutput: Variable[]) {
        this.calculatedOutput = calculatedOutput;
    }

    updateOutputVariable(it: Variable) {
        if (!this.calculatedOutput) this.calculatedOutput = this.getBlock().output;

        const toUpdate = this.calculatedOutput.findIndex(t => t.name === it.name);
        if (toUpdate === -1) {
            throw new Error(`Cannot update Variable ${it.name} as it is not present in the output variables`);
        }

        this.calculatedOutput[toUpdate] = it;
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

        const input = await this.getInput();
        const variables = await this.execute(input);
        const result: RunResult = { at: Date.now(), variables };
        this.lastRunResult = result;

        console.log(`${this.blockID} - Computed Output`, result);

        for (const handler of this.runHandlers) {
            handler(result);
        }

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
    async execute(input: VariableRecord): Promise<VariableRecord> {
        throw new Error("Method not implemented.");
    }
}


class VisualizeRuntimeBlock extends RuntimeBlock<VisualizeBlock> {
    executeUpdate(update: Partial<VisualizeBlock>): Partial<VisualizeBlock> {
        throw new Error("Method not implemented.");
    }
    async execute(input: VariableRecord): Promise<VariableRecord> {
        // TODO : Calculate visual

        return { /* no output */ };
    }
}