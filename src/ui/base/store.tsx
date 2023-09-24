import { useEffect, useState } from "react";
import { Block, BlockID } from "../../model/block";
import { ModelStore } from "../../runtime/store";

export const useBlockList = (store: ModelStore) => {
    const [list, setList] = useState<Readonly<Readonly<Block>[]>>([]);

    useEffect(() => store.listen(setList), [store]);

    return list;
};

export const useBlock = (store: ModelStore, blockID: BlockID) => {
    const [block, setBlock] = useState<Readonly<Block>>(store.getBlock(blockID));

    useEffect(() => store.listenForBlock(store.getBlock(blockID), setBlock), [store, setBlock, blockID]);

    return block;
}