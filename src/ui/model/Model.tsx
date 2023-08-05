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

export function getUIForBlock(props: BlockUIProps<Block>) {
    (props as any).key = props.block.blockID;

    if (props.block.type === "datasource") {
        return <>TODO</>;      
    }

    if (props.block.type === "javascript") {
        return <ScriptBlockUI {...(props as BlockUIProps<ScriptBlock>)} />;
    }

    if (props.block.type === "markdown") {
        return <MarkdownBlockUI {...(props as BlockUIProps<MarkdownBlock>)} />;
    }

    if (props.block.type === "visualize") {
        return <VisualizeBlockUI {...(props as BlockUIProps<VisualizeBlock>)} />;
    }
}

export function partitionBlocks(blocks: Block[]): Block[][] {
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

export function ModelUI({ model, setModel }: { model: CellularModel, setModel: (it: CellularModel) => void }) {
    const runtime = useMemo(() => new Runtime(), []);

    const updateBlock = useCallback((block: Block, update: Partial<Block>) => {
        update = runtime.updateBlock(block, update);

        const updatedBlocks = model!.blocks.map(it => it.blockID === block.blockID ? Object.assign({}, it, update) : it);
        setModel(Object.assign({}, model, { blocks: updatedBlocks }));
    }, [model, setModel]);

    const addBlock = useCallback((block: Block) => {
        runtime.addBlock(block);

        setModel({ ...model, blocks: [...model.blocks, block]});
    }, [model, setModel]);

    const removeBlock = useCallback((block: Block) => {
        runtime.removeBlock(block);

        setModel({ ...model, blocks: model.blocks.filter(it => it.blockID !== block.blockID )});
    }, [model, setModel]);

    const partitions = partitionBlocks(model.blocks);

    return <>
        {partitions.map(partition => <>
            <BlockUI.Row>
                {partition.map(block => getUIForBlock({ block, removeBlock, updateBlock, runtime }))}
            </BlockUI.Row>
            <BlockUI.Connecter />
        </>)}
        <AddBlock model={model} add={addBlock} />
    </>

}