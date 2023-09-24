import { MarkdownBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Editable } from "../base/Editable";
import { Editor } from "../base/Editor";
import { IconButton } from "../base/Icons";
import { BlockUIProps } from "../base/types";


export function MarkdownBlockUI({ block, runtime }: BlockUIProps<MarkdownBlock>) {
    return <BlockUI>
        <ButtonList right>
            <IconButton small icon="cancel" onClick={() => runtime.removeBlock(block)} />
        </ButtonList>
        <Editor markdown={block.content} onFinish={(content) => { runtime.updateBlock(block, { content })}} />
    </BlockUI>
}