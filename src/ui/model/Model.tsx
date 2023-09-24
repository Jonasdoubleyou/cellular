import { ReactElement, ReactPropTypes, useCallback, useMemo, useState } from "react";
import { Block, MarkdownBlock, ScriptBlock, VisualizeBlock } from "../../model/block";
import { CellularModel } from "../../model/model";
import { Runtime } from "../../runtime";
import { BlockUI } from "../base/Block";
import { BlockUIProps } from "../base/types";
import { MarkdownBlockUI } from "../markdown/MarkdownBlock";
import { ScriptBlockUI } from "../script/ScriptBlock";
import { VisualizeBlockUI } from "../visualize/VisualizeBlock";
import { AddBlock } from "./AddBlock";
import { ModelStore } from "../../runtime/store";
import { useBlockList } from "../base/store";

export function getUIForBlock(props: BlockUIProps) {
    (props as any).key = props.blockID;

    const block = props.runtime.getBlock(props.blockID);
    if (block.type === "datasource") {
        return <>TODO</>;      
    }

    if (block.type === "javascript") {
        return <ScriptBlockUI {...props} />;
    }

    if (block.type === "markdown") {
        return <MarkdownBlockUI {...props} />;
    }

    if (block.type === "visualize") {
        return <VisualizeBlockUI {...props} />;
    }
}

export function partitionBlocks(blocks: Readonly<Readonly<Block>[]>): Readonly<Block>[][] {
    const partitions: Block[][] = [[]];
    const currentPartition = () => partitions[partitions.length - 1];
    const lastBlock = () => {
        const part = currentPartition();
        if (part.length === 0) return null;
        return part[part.length - 1];
    };
    const addPartition = (block: Block) => partitions.push([block]);

    for(const block of blocks) {
        if (block.type === "datasource" && lastBlock()?.type === "datasource") {
            // Group consecutive datasources together
            currentPartition().push(block);
        } else if (block.type === "markdown" && currentPartition().length === 1 && ["javascript", "visualize"].includes(lastBlock()!.type)) {
            // Push Markdown to the right of previous blocks
            currentPartition().push(block);
        } else {
            addPartition(block);
        }
    }

    return partitions;
}

export function ModelUI({ store }: { store: ModelStore }) {
    const runtime = useMemo(() => new Runtime(store), [store]);

    const blockList = useBlockList(store);
    const partitions = partitionBlocks(blockList);

    return <>
        {partitions.map(partition => <>
            <BlockUI.Row>
                {partition.map(block => getUIForBlock({ blockID: block.blockID, runtime }))}
            </BlockUI.Row>
            <BlockUI.Connecter />
        </>)}
        <AddBlock store={store} add={block => runtime.addBlock(block)} />
    </>

}