import { VisualizeBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Editable } from "../base/Editable";
import { IconButton } from "../base/Icons";
import { useBlock } from "../base/store";
import { BlockUIProps } from "../base/types";


export function VisualizeBlockUI({ blockID, runtime }: BlockUIProps) {
    const block = useBlock<VisualizeBlock>(runtime.getStore(), blockID);

    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<Editable text={block.name} onFinish={() => {}} />} />
            <ButtonList>
                <IconButton icon="cancel" onClick={() => runtime.removeBlock(block)} />
            </ButtonList>
        </BlockUI.Header>
    </BlockUI>;
}