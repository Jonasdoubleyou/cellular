import { Editor as CodeEditor, loader } from "@monaco-editor/react";
import { editor, Range, Uri } from "monaco-editor/esm/vs/editor/editor.api";

loader.init().then(monaco => {
    // TODO: Autocompletion?
    monaco.languages.registerCompletionItemProvider({
        language: "javascript"
    }, {
        provideCompletionItems(model, position, context) {
            return {
                suggestions: [{ insertText: "Test", kind: 0, label: "test", range: new Range(0, 0, 0, 0) }]
            }
        }
    });

    monaco.editor.addEditorAction({ id: 'Test', label: "Test", run: () => {} });

    const libContent = "declare function test(user: string); ";
    const libUri = "ts:filename/context.d.ts";
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libContent, libUri);
    monaco.editor.createModel(libContent, "typescript", Uri.parse(libUri));
});