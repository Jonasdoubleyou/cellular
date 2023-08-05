import { VisualizeBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Editable } from "../base/Editable";
import { IconButton } from "../base/Icons";
import { BlockUIProps } from "../base/types";


export function VisualizeBlockUI({ block, removeBlock }: BlockUIProps<VisualizeBlock>) {
    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<Editable text={block.name} onFinish={() => {}} />} />
            <ButtonList>
                <IconButton icon="cancel" onClick={() => removeBlock(block)} />
            </ButtonList>
        </BlockUI.Header>
    </BlockUI>;
}