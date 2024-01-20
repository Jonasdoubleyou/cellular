import { useState } from "react";
import { Block, VisualizeBlock, createBlockID } from "../../model/block";
import { CellularModel } from "../../model/model";
import { ModelStore } from "../../runtime/store";
import { BlockUI } from "../base/Block";
import { Button, ButtonList, SelectButtonList } from "../base/Button";
import { Icon, IconButton } from "../base/Icons";

const ONE_D_VISUALIZATIONS: VisualizeBlock["graphtype"][] = [
    "number"
];


const TWO_D_VISUALIZATIONS: VisualizeBlock["graphtype"][] = [
    "boxplot",
    "histogram",
    "table"
];

const THREE_D_VISUALIZATIONS: VisualizeBlock["graphtype"][] = [
];

export function AddBlock({ store, add, chooseFile }: { store: ModelStore, add: (block: Block) => void, chooseFile: () => void }) {
    const [chosenDimension, setChosenDimension] = useState<null | "1" | "2" | "3">(null);
    const [chosenVisualization, setChosenVisualization] = useState<null | string>(null);

    function addScript() {
        setChosenVisualization(null);
        setChosenDimension(null);
        add({
            type: "javascript",
            blockID: createBlockID(),
            script: "Script",
            title: "",
            inputs: [],
            output: []
        });
    }

    function addMarkdown() {
        setChosenVisualization(null);
        setChosenDimension(null);
        add({
            type: "markdown",
            blockID: createBlockID(),
            content: "# Markdown",
            inputs: [],
            output: []
        });
    }

    function addVisualize() {
        add({
            type: "visualize",
            blockID: createBlockID(),
            dimensions: [],
            graphtype: chosenVisualization as any,
            inputs: [],
            output: [],
            name: "Visual"
        })
        setChosenVisualization(null);
        setChosenDimension(null);
    }

    return <div className="no-print">
        <BlockUI>
            <BlockUI.Header>
                <BlockUI.Title title="Add a Block" />
            </BlockUI.Header>
            <ButtonList>
                <IconButton icon="add" text="Add Script" onClick={addScript} />
                <IconButton icon="add" text="Add Datasource" onClick={chooseFile} />
                <IconButton icon="add" text="Add Markdown" onClick={addMarkdown} />
                <IconButton icon="add" text="Add Visualization" onClick={() => setChosenDimension("1")} />
            </ButtonList>

            {chosenDimension !== null && <SelectButtonList chosen={chosenDimension} onChose={setChosenDimension as any} options={["1", "2", "3"]} map={it => `${it} dimensional`} /> }
            {chosenDimension === "1" && <SelectButtonList chosen={chosenVisualization} onChose={setChosenVisualization} options={ONE_D_VISUALIZATIONS} />}
            {chosenDimension === "2" && <SelectButtonList chosen={chosenVisualization} onChose={setChosenVisualization} options={TWO_D_VISUALIZATIONS} />}
            {chosenDimension === "3" && <SelectButtonList chosen={chosenVisualization} onChose={setChosenVisualization} options={THREE_D_VISUALIZATIONS} />}
            
            {chosenVisualization && <IconButton icon="add" onClick={addVisualize} text="Add" />}
        </BlockUI>
    </div>;
}
