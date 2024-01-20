import { ReactElement, ReactPropTypes, useCallback, useEffect, useMemo, useState } from "react";
import { Block, MarkdownBlock, ScriptBlock, VisualizeBlock, createBlockID } from "../../model/block";
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
import { DataSourceBlockUI } from "../datasource/DataSource";
import { ButtonList } from "../base/Button";
import { IconButton } from "../base/Icons";
import { Workspace } from "../../runtime/workspace";
import { FileBrowser } from "../datasource/FileBrowser";
import { File } from "../../runtime/filestore";

export function getUIForBlock(props: BlockUIProps) {
    (props as any).key = props.blockID;

    const block = props.runtime.getBlock(props.blockID);
    if (block.type === "datasource") {
        return <DataSourceBlockUI {...props} />;      
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


export function ModelUI({ model, workspace }: { model: CellularModel, workspace: Workspace }) {
    const store = useMemo(() => new ModelStore(model), [model]);
    const [showFiles, setShowFiles] = useState(false);

    useEffect(() => {
        window.document.title = `${model.title} - Cellular`;
    }, [model]);
    
    
    const runtime = useMemo(() => new Runtime(store), [store]);

    const blockList = useBlockList(store);
    const partitions = partitionBlocks(blockList);

    function chooseFile(file: File) {
        runtime.addBlock({
            blockID: createBlockID(),
            type: "datasource",
            path: file.fullPath(),
            name: file.name,
            sourcetype: file.sourcetype,
            inputs: [],
            output: [{
                name: file.deriveVariableName(),
                type: { base: "object", instanceOf: "Table" }
            }]
        });

        setShowFiles(false);
    }

    return <div className="app">
        {showFiles && <FileBrowser onClose={() => setShowFiles(false)} filestore={workspace.getFiles()} onChoose={chooseFile} />}
        <div className="app-header">
            <div className="app-title">
                CELLULAR <div className="app-title-model">/ {model.title}</div>
            </div>
            <div className="app-nav">
                <ButtonList>
                <IconButton icon="add" text="Add" />
                <IconButton icon="save" />
                <IconButton icon="settings" />
                <IconButton icon="print" onClick={() => window.print()} />
                </ButtonList>

            </div>
            </div>
            
        {partitions.map(partition => <>
            <BlockUI.Row>
                {partition.map(block => getUIForBlock({ blockID: block.blockID, runtime }))}
            </BlockUI.Row>
            <BlockUI.Connecter />
        </>)}
        <AddBlock chooseFile={() => setShowFiles(true)} store={store} add={block => runtime.addBlock(block)} />
    </div>;

}