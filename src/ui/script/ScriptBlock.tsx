import { useEffect, useRef, useState } from "react";
import { ScriptBlock, UpdateBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { Editable } from "../base/Editable";
import { IconButton } from "../base/Icons";
import { Editor as CodeEditor, loader } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";

import "./code";
import "./ScriptBlock.css";
import { setupEditor } from "./editor";
import { BlockUIProps } from "../base/types";
import { ButtonList } from "../base/Button";

const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly: false,
    minimap: { enabled: false },
    overviewRulerLanes: 0,
    // scrollbar: { vertical: "hidden", horizontal: "hidden", handleMouseWheel: false }
    
};

export function ScriptBlockUI({ block, updateBlock, removeBlock, runtime }: BlockUIProps<ScriptBlock>) {
    const editor = useRef<editor.IStandaloneCodeEditor>();

    function save() {
        const newScript = editor.current!.getModel()!.getValue();
        updateBlock(block, { script: newScript });
    }

    useEffect(() => {
        if (editor.current) {
            setupEditor(editor.current, block);
        }
    }, [block.script]);

    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<Editable text={block.title} onFinish={title => updateBlock(block, { title })} />} />
            <ButtonList>
                <IconButton icon="save" text="Save" onClick={save} />
                <IconButton icon="play_arrow" text="Run" />
                <IconButton icon="cancel" onClick={() => removeBlock(block)} />
            </ButtonList>
        </BlockUI.Header>
        <div className="script-block">
            <CodeEditor theme="vs-dark" options={monacoOptions} defaultLanguage="javascript"  onMount={(it) => { editor.current = it; }}/>
        </div>
    </BlockUI>
}