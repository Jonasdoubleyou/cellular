import { Block, BlockID } from "../model/block";
import { CellularModel } from "../model/model";

type BlockListListener = (blockList: Readonly<Readonly<Block>[]>) => void;
type BlockUpdateListener<BlockType> = (block: Readonly<BlockType>) => void;

export interface ReadonlyModelStore {
    listen(listener: BlockListListener): () => void;
    listenForBlock<BlockType extends Block = Block>(block: Readonly<BlockType>, listener: BlockUpdateListener<BlockType>): () => void;

    getBlocks(): Readonly<Readonly<Block>[]>;
    getBlock<BlockType extends Block = Block>(blockID: BlockID): Readonly<BlockType>;
}

export class ModelStore implements ReadonlyModelStore {
    private currentModel: Readonly<CellularModel>;
    private originalModel: Readonly<CellularModel>;

    constructor(model: Readonly<CellularModel>) {
        this.currentModel = model;
        this.originalModel = model;
    }
    
    blockListListeners: BlockListListener[] = [];
    blockUpdateListener: Map<BlockID, BlockUpdateListener<Block>[]> = new Map();

    listen(listener: BlockListListener): () => void {
        this.blockListListeners.push(listener);
        return () => { this.blockListListeners = this.blockListListeners.filter(it => it !== listener) };
    }

    listenForBlock<BlockType extends Block = Block>(block: Readonly<BlockType>, listener: BlockUpdateListener<BlockType>): () => void {
        this.blockUpdateListener.get(block.blockID)!.push(listener as BlockUpdateListener<Block>);
    
        return () => {
            const listeners = this.blockUpdateListener.get(block.blockID);
            if (!listeners) return;
            this.blockUpdateListener.set(block.blockID, listeners.filter(it => it !== listener));
        };
    }

    setModel(newModel: CellularModel) {
        console.log("ModelStore - Set Model", this.currentModel, newModel);

        this.currentModel = newModel;
        for (const listener of this.blockListListeners) listener(newModel.blocks);
    }
    
    addBlock(block: Block) {
        const newModel = { ...this.currentModel, blocks: [...this.currentModel.blocks, block] };
        this.blockUpdateListener.set(block.blockID, []);
        this.setModel(newModel);
    }

    removeBlock(block: Block) {
        const newModel = { ...this.currentModel, blocks: this.currentModel.blocks.filter(it => it.blockID !== block.blockID) };
        this.setModel(newModel);

        this.blockUpdateListener.delete(block.blockID);
    }

    updateBlock(block: Block, update: Partial<Block>) {
        console.log("ModelStore - UpdatingBlock", block, update);

        const newBlock = Object.assign({}, block, update);
        const newModel = { ...this.currentModel, blocks: this.currentModel.blocks.map(it => it.blockID === block.blockID ? newBlock : it) };
        this.currentModel = newModel;
        
        for (const listener of (this.blockUpdateListener.get(block.blockID) ?? [])) listener(newBlock);
    }


    getBlocks(): Readonly<Readonly<Block>[]> { return this.currentModel.blocks };

    getBlock<BlockType extends Block = Block>(blockID: BlockID): Readonly<BlockType> {
        const result = this.currentModel.blocks.find(it => it.blockID === blockID);
        if (!result) {
            throw new Error(`Could not find Block(${blockID})`);
        }

        return result as BlockType;
    }

    // All Blocks before a Block could be their input
    *getBlocksBefore(block: Block) {
        const pos = this.currentModel.blocks.findIndex(it => it.blockID === block.blockID);
        if (pos === -1) {
            throw new Error(`Block not found in Model`);
        }

        for (let i = pos - 1; i >= 0; i -= 1) {
            yield this.currentModel.blocks[i];
        }
    }

    *getAllInputVariables(block: Block) {
        for (const blockBefore of this.getBlocksBefore(block)) {
            for (const out of blockBefore.output) {
                yield out;
            }
        }
    }
}