import { MarkdownBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { Editable } from "../base/Editable";
import { Editor } from "../base/Editor";
import { IconButton } from "../base/Icons";
import { BlockUIProps } from "../base/types";


export function MarkdownBlockUI({ block, runtime }: BlockUIProps<MarkdownBlock>) {
    return <BlockUI>
        <IconButton icon="cancel" onClick={() => runtime.removeBlock(block)} />
        <Editor markdown={block.content} onFinish={(content) => { runtime.updateBlock(block, { content })}} />
    </BlockUI>
}