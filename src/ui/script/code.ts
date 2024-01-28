import { Editor as CodeEditor, Monaco, loader } from "@monaco-editor/react";
import { editor, Range, Uri } from "monaco-editor/esm/vs/editor/editor.api";
import { Variable } from "../../model/variables";

let monaco: Monaco | null = null;

(async function setupMonaco() {
    monaco = await loader.init();
    console.log("Loaded Monaco", monaco);

    /* monaco.languages.registerCompletionItemProvider({
        language: "javascript"
    }, {
        provideCompletionItems(model, position, context) {
            return {
                suggestions: [{ insertText: "Test", kind: 0, label: "test", range: new Range(0, 0, 0, 0) }]
            }
        }
    });

    monaco.editor.addEditorAction({ id: 'Test', label: "Test", run: () => {} }); */

    const js = monaco.languages.typescript.javascriptDefaults;
    // Turns on semantic validation for JS
    js.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false
    });
    
    // Typescript Compiler options
    js.setCompilerOptions({
        allowJs: true,
        checkJs: true,
        allowNonTsExtensions: true,
        strict: true,
        noImplicitAny: true,
    })

    // Load typings for the standard library
    const libContent = await (await fetch("/library.d.ts")).text();
    js.addExtraLib(libContent, "ts:library.d.ts");
})();

export function provideTypes(name: string, variables: readonly Variable[]) {
    if (monaco) {
        let declarations = "";
        for (const { type, name} of variables) {
            declarations += `declare var ${name}: ${type.base};`;
        }
    
        const js = monaco.languages.typescript.javascriptDefaults;
        js.addExtraLib(declarations,`ts:${name}.d.ts`);

        console.log(js.getExtraLibs());
    }
}