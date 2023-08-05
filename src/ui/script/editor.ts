import { editor, IDisposable, IEvent, IPosition, IRange, Position, Range, Selection, Uri } from "monaco-editor/esm/vs/editor/editor.api";
import { ScriptBlock } from "../../model/block";


export function setupEditor(codeEditor: editor.IStandaloneCodeEditor, block: ScriptBlock) {
    if (codeEditor.getModel()) return;

    const model = editor.createModel(block.script, "javascript", undefined);
    codeEditor.setModel(model)!;
}