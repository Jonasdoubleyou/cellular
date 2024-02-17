import { DataSourceBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Icon, IconButton } from "../base/Icons";
import { useBlock } from "../base/store";
import { BlockUIProps } from "../base/types";


export function DataSourceBlockUI({ blockID, runtime }: BlockUIProps) {
    const block = useBlock<DataSourceBlock>(runtime.getStore(), blockID);

    return <BlockUI>
        <h1><Icon icon="save" /> {block.path}</h1>
        {block.summary}
        <ButtonList right>
            <IconButton small icon="cancel" onClick={() => runtime.removeBlock(block)} />
        </ButtonList>
    </BlockUI>
}