import type { Runtime } from ".";
import { Block, DataSourceBlock, ScriptBlock, VisualizeBlock } from "../model/block";
import { VariableRecord } from "../model/variables";
import { analyzeScript } from "./script/analyze";

export type RunResult = { at: number, variables: VariableRecord };
type OnRunHandler = (runResult: RunResult) => void;

export abstract class RuntimeBlock<BlockType extends Block> {
    block: BlockType;
    runtime: Runtime;

    lastChangedAt: number | null = null;
    
    lastRunResult: RunResult | null = null;

    runHandlers: OnRunHandler[] = [];
    onRun(handler: OnRunHandler) {
        this.runHandlers.push(handler);

        return () => { this.runHandlers = this.runHandlers.filter(it => it !== handler) };
    }

    constructor(block: BlockType, runtime: Runtime) {
        this.block = block;
        this.runtime = runtime;
    }

    update(update: Partial<BlockType>): Partial<BlockType> {
        this.block = Object.assign({}, this.block, update);
        this.lastChangedAt = Date.now();

        return this.executeUpdate(update);
    }

    abstract executeUpdate(update: Partial<BlockType>): Partial<BlockType>;

    hasValidResult() {
        return this.lastRunResult && (!this.lastChangedAt || this.lastChangedAt < this.lastRunResult.at);
    }

    async getInput(): Promise<VariableRecord> {
        console.log(`${this.block.blockID} - Calculating Input`);

        const result: VariableRecord = {};
        for (const input of this.block.inputs) {
            const inputBlock = this.runtime.getRuntimeBlock(input.blockID);
            const inputVariables = await inputBlock.getOutput();
            for (const [name, value] of Object.entries(inputVariables)) {
                if (name in result) {
                    throw new Error(`Input Variable collision of '${name}'`);
                }
                result[name] = value;
            }
        }

        console.log(`${this.block.blockID} - Calculated Input`, result);

        return result;
    }

    async getOutput(): Promise<VariableRecord> {
        if (this.hasValidResult()) {
            console.log(`${this.block.blockID} - Returning cached Output`, this.lastRunResult);
            return this.lastRunResult!;
        }

        const input = await this.getInput();
        const variables = await this.execute(input);
        const result: RunResult = { at: Date.now(), variables };
        this.lastRunResult = result;

        console.log(`${this.block.blockID} - Computed Output`, result);

        for (const handler of this.runHandlers) {
            handler(result);
        }

        return result;
    }

    abstract execute (input: VariableRecord): Promise<VariableRecord>;

    static create(block: Block, runtime: Runtime): RuntimeBlock<Block> | null {
        if (block.type === "javascript") {
            return new ScriptRuntimeBlock(block, runtime);
        }

        if (block.type === "datasource") {
            return new DatasourceRuntimeBlock(block, runtime);
        }

        if (block.type === "visualize") {
            return new VisualizeRuntimeBlock(block, runtime);
        }

        return null;
    }
}

class ScriptRuntimeBlock extends RuntimeBlock<ScriptBlock> {
    executeUpdate(update: Partial<ScriptBlock>): Partial<ScriptBlock> {
        if (update.script) {
            analyzeScript(update.script, this.runtime);
        }

        return update;
    }
    async execute(input: VariableRecord): Promise<VariableRecord> {
        throw new Error("Method not implemented.");
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