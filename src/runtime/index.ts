import { Block, BlockID, BlockInput } from "../model/block";
import { Variable, isAssignableTo } from "../model/variables";
import { RuntimeBlock } from "./block";
import { ModelStore, ReadonlyModelStore } from "./store";

export class Runtime {
    // State Management

    runtimeBlocks = new Map<BlockID, RuntimeBlock<Block>>();
    
    constructor(private modelStore: ModelStore) {
        for (const block of modelStore.getBlocks())
            this.addRuntimeBlock(block);
    }

    getStore(): ReadonlyModelStore { return this.modelStore; }

    getBlock<BlockType extends Block = Block>(blockID: BlockID): Readonly<BlockType> {
        return this.modelStore.getBlock(blockID) as BlockType;
    }

    getRuntimeBlock(blockID: BlockID): RuntimeBlock<Block> {
        const block = this.runtimeBlocks.get(blockID);
        if (!block) {
            throw new Error(`Missing RuntimeBlock for Block(${blockID})`);
        }

        return block;
    }


    addBlock(block: Block) {
        this.modelStore.addBlock(block);
        this.addRuntimeBlock(block);
    }

    addRuntimeBlock(block: Block) {
        const runtimeBlock = RuntimeBlock.create(block, this);
        if (runtimeBlock) {
            this.runtimeBlocks.set(block.blockID, runtimeBlock);
            console.log(`Runtime - Added Block(${block.blockID})`, runtimeBlock);
        }
    }

    // enriches a block update with runtime information, i.e. if a code block changes
    // recalculate the dependencies
    updateBlock(block: Readonly<Block>, update: Partial<Block>) {
        const runtimeBlock = this.runtimeBlocks.get(block.blockID);
        if (runtimeBlock) {
            runtimeBlock.update(update);
            console.log(`Runtime - Updated Block(${block.blockID})`, update);
            return;
        }

        this._updateBlock(block, update);
    }

    _updateBlock(block: Readonly<Block>, update: Partial<Block>) {
        this.modelStore.updateBlock(block, update);
    }

    rewireInputs(runtimeBlock: RuntimeBlock, requiredInputs: Variable[]) {
        const fullfilled: Set<string> = new Set();

        for (const existingInput of runtimeBlock.getBlock().inputs) {
            const block = this.modelStore.getBlock(existingInput.blockID);
            const existing = requiredInputs.filter(it => block.output.some(out => out.name === it.name && isAssignableTo(out.type, it.type)));
            for (const it of existing) {
                if (fullfilled.has(it.name)) continue;

                existingInput.variables.push(it.name);
                fullfilled.add(it.name);
            }
        }

        for (const blockBefore of this.modelStore.getBlocksBefore(runtimeBlock.getBlock())) {
            const existing = requiredInputs.filter(it => blockBefore.output.some(out => out.name === it.name && isAssignableTo(out.type, it.type)));
            if (existing.length > 0) {
                const input: BlockInput = { blockID: blockBefore.blockID, variables: [] };
    
                for (const it of existing) {
                    if (fullfilled.has(it.name)) continue;

                    input.variables.push(it.name);
                    fullfilled.add(it.name);
                }

                if (input.variables.length) runtimeBlock.getBlock().inputs.push(input);
            }            
        }

        return requiredInputs.filter(it => !fullfilled.has(it.name));
    }

    removeBlock(block: Block) {
        this.runtimeBlocks.delete(block.blockID);
        console.log(`Runtime - Deleted Block(${block.blockID})`);
        this.modelStore.removeBlock(block);
    }


}