import { Block } from "../../model/block";
import { CellularModel } from "../../model/model";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { IconButton } from "../base/Icons";

const createBlockID = () => "" + Date.now();

export function AddBlock({ model, add }: { model: CellularModel, add: (block: Block) => void }) {
    function addScript() {
        add({
            type: "javascript",
            blockID: createBlockID(),
            script: "",
            title: "",
            inputs: [],
            output: []
        });
    }

    function addMarkdown() {
        add({
            type: "markdown",
            blockID: createBlockID(),
            content: "# Markdown",
            inputs: [],
            output: []
        });
    }

    function addDatasource() {
        add({
            type: "datasource",
            blockID: createBlockID(),
            name: "",
            path: "",
            sourcetype: "json",
            inputs: [],
            output: []
        });
    }

    function addVisualize() {

    }

    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title="Add a Block" />
        </BlockUI.Header>
        <ButtonList>
            <IconButton icon="add" text="Add Script" onClick={addScript} />
            <IconButton icon="add" text="Add Datasource" onClick={addDatasource} />
            <IconButton icon="add" text="Add Markdown" onClick={addMarkdown} />
            <IconButton icon="add" text="Add Visualization" onClick={addVisualize} />
        </ButtonList>
    </BlockUI>
}
