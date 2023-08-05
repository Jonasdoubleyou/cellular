import { Block, BlockID } from "../model/block";
import { CellularModel } from "../model/model";
import { RuntimeBlock } from "./block";

export class Runtime {
    // State Management

    runtimeBlocks = new Map<BlockID, RuntimeBlock<Block>>();

    getRuntimeBlock(blockID: BlockID): RuntimeBlock<Block> {
        const block = this.runtimeBlocks.get(blockID);
        if (!block) {
            throw new Error(`Missing RuntimeBlock for Block(${blockID})`);
        }

        return block;
    }

    // Model Management

    initialize(model: CellularModel) {
        for (const block of model.blocks)
            this.addBlock(block);
    }

    addBlock(block: Block) {
        const runtimeBlock = RuntimeBlock.create(block, this);
        if (runtimeBlock) {
            this.runtimeBlocks.set(block.blockID, runtimeBlock);
            console.log(`Runtime - Added Block(${block.blockID})`, runtimeBlock);
        }
    }

    // enriches a block update with runtime information, i.e. if a code block changes
    // recalculate the dependencies
    updateBlock(block: Block, update: Partial<Block>): Partial<Block> {
        const runtimeBlock = this.runtimeBlocks.get(block.blockID);
        if (runtimeBlock) {
            const result = runtimeBlock.update(update);
            console.log(`Runtime - Updated Block(${block.blockID})`, update, result);
            return result;
        }
        
        return update;
    }

    removeBlock(block: Block) {
        this.runtimeBlocks.delete(block.blockID);
        console.log(`Runtime - Deleted Block(${block.blockID})`);
    }


}