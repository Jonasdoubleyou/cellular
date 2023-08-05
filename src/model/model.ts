import { Block, BlockID } from "./block";

export interface CellularModel {
    title: string;
    blocks: Block[];
}

export function getBlock(model: CellularModel, blockID: BlockID): Block {
    const result = model.blocks.find(it => it.blockID === blockID);
    if (!result) {
        throw new Error(`Could not find Block(${blockID})`);
    }

    return result;
}