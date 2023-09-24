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
import { BlockUIProps, useRunResult, useRuntimeBlock } from "../base/types";
import { ButtonList } from "../base/Button";
import { RunResult, RuntimeBlock } from "../../runtime/block";
import { Variable } from "../../model/variables";

const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly: false,
    minimap: { enabled: false },
    overviewRulerLanes: 0,
    // scrollbar: { vertical: "hidden", horizontal: "hidden", handleMouseWheel: false }
    
};

function VariableUI({ variable, value }: { variable: Variable, value?: any }) {
    console.log("VariableUI", variable, value);

    return <div className="variable">
        <div className="variable-name">{variable.name}</div>
        <div className="variable-type">({variable.type.base})</div>
        {value !== undefined && <div className="variable-value">{": " + value}</div>}
    </div>;
}

function RunResultUI({ runResult, rb }: { runResult: RunResult, rb: RuntimeBlock<any> }) {
    return <div className="run-result-container">
            <div className="run-result">
            <div className="run-result-at">{new Date(runResult.at).toLocaleTimeString()}</div>
            <div className="run-result-separator"> / </div>
            <div className="run-result-input">
                ( {rb.getInputVariables().map(it => <VariableUI variable={it} />) } )
            </div>
            <div className="run-result-separator"> -&gt; </div>
            <div className="run-result-output">
                ( {rb.getOutputVariables().map(it => <VariableUI variable={it} value={runResult.variables?.[it.name]} />)} )
            </div>
        </div>
        {runResult.errors.length > 0 && <div className="run-result-errors">
            {runResult.errors.map(it => <div className="run-result-error">
                {it.name}: {it.message}
            </div>)}
        </div>}    
    </div>
}

export function ScriptBlockUI({ block, runtime }: BlockUIProps<ScriptBlock>) {
    const editor = useRef<editor.IStandaloneCodeEditor>();
    const rb = useRuntimeBlock(block, runtime);
    const runResult = useRunResult(block, runtime);

    function save() {
        const newScript = editor.current!.getModel()!.getValue();
        runtime.updateBlock(block, { script: newScript });
    }

    useEffect(() => {
        if (editor.current) {
            setupEditor(editor.current, block);
        }
    }, [block.script]);

    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<Editable text={block.title} onFinish={title => runtime.updateBlock(block, { title })} />} />
            <ButtonList>
                <IconButton icon="play_arrow" text="Save & Run" onClick={() => { save(); rb.getOutput(); }}/>
                <IconButton icon="save" text="Save" onClick={save} />
                <IconButton icon="cancel" onClick={() => runtime.removeBlock(block)} />
            </ButtonList>
        </BlockUI.Header>
        <div className="script-block">
            <CodeEditor theme="vs-dark" options={monacoOptions} defaultLanguage="javascript"  onMount={(it) => { editor.current = it; }}/>
        </div>
        {runResult && <RunResultUI runResult={runResult} rb={rb} />}
    </BlockUI>
}