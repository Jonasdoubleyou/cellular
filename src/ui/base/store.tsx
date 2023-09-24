import { useEffect, useState } from "react";
import { Block, BlockID } from "../../model/block";
import { ModelStore, ReadonlyModelStore } from "../../runtime/store";

export const useBlockList = (store: ReadonlyModelStore) => {
    const [list, setList] = useState<Readonly<Readonly<Block>[]>>([]);

    useEffect(() => store.listen(setList), [store]);

    return list;
};

export const useBlock = <BlockType extends Block = Block>(store: ReadonlyModelStore, blockID: BlockID) => {
    const [block, setBlock] = useState<Readonly<BlockType>>(store.getBlock<BlockType>(blockID));

    useEffect(() => store.listenForBlock(store.getBlock<BlockType>(blockID), setBlock), [store, setBlock, blockID]);

    return block;
}