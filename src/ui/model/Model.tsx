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
import { createDatasource } from "../../runtime/datasource/datasource";

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

// The minimum width of a block in "columns" - This prevents grouping of too much blocks
function minWidth(block: Readonly<Block>): 1 | 2 | 3 | 4 {
    switch(block.type) {
        case "datasource":
            return 2;
        case "javascript":
            return 3;
        case "markdown":
            return 1;
        case "visualize":
            switch (block.graphtype) {
                case "number":
                    return 1;
                case "boxplot":
                    return 1;
                case "histogram":
                    return 2;
                case "json":
                    return 3;
                case "table":
                    return 4;
            }
        default:
            return 4;
    }
}

export function partitionBlocks(blocks: Readonly<Readonly<Block>[]>): Readonly<Block>[][] {
    const partitions: Block[][] = [[]];
    const currentPartition = () => partitions[partitions.length - 1];
    const currentWidth = () => currentPartition().reduce((sum, block) => sum + minWidth(block), 0);

    const lastBlock = () => {
        const part = currentPartition();
        if (part.length === 0) return null;
        return part[part.length - 1];
    };
    const addPartition = (block: Block) => partitions.push([block]);

    for(const block of blocks) {
        if (currentWidth() + minWidth(block) > 4) {
            // Prevent grouping blocks too much so that they would overflow 
            addPartition(block);
            continue;
        }

        if (block.type === "datasource" && lastBlock()?.type === "datasource") {
            // Group consecutive datasources together
            currentPartition().push(block);
        } else if (block.type === "visualize" && lastBlock()?.type === "visualize") {
            // Group consecutive visualizations together
            // TODO: Probably need to wrap larger visuals
            currentPartition().push(block);
        } else if (block.type === "markdown" && ["javascript", "visualize"].includes(lastBlock()!.type)) {
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
    
    
    const runtime = useMemo(() => new Runtime(store, workspace), [store, workspace]);

    const blockList = useBlockList(store);
    const partitions = partitionBlocks(blockList);

    function chooseFile(file: File) {
        createDatasource(file, workspace).then(it => runtime.addBlock(it));

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