import { MarkdownBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { Editable } from "../base/Editable";
import { Editor } from "../base/Editor";
import { IconButton } from "../base/Icons";
import { BlockUIProps } from "../base/types";


export function MarkdownBlockUI({ block, updateBlock, removeBlock, runtime }: BlockUIProps<MarkdownBlock>) {
    return <BlockUI>
        <IconButton icon="cancel" onClick={() => removeBlock(block)} />
        <Editor markdown={block.content} onFinish={(content) => { updateBlock(block, { content })}} />
    </BlockUI>
}