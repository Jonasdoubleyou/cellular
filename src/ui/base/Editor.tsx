import { useCallback, useLayoutEffect, useRef, useState } from "react";
import "./Editor.css";
import { IconButton } from "./Icons";

export function Editor({ markdown, onFinish }: { markdown: string, onFinish: (markdown: string) => void }) {
    const [edit, setEdit] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // When the Editor is opened for editing, focus it with the cursor and move the cursor to the end of the doc
    useLayoutEffect(() => { 
        if (editorRef.current) {
            editorRef.current.focus(); 
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
        }
    }, [edit]);

    const [rendered, setRendered] = useState(() => renderMarkdown(markdown));

    const cancel = useCallback(() => {
        setEdit(false);
        if (editorRef.current) editorRef.current.textContent = markdown;
    }, [markdown, setEdit, editorRef]);

    const save = useCallback(() => {
        setEdit(false);
        if (editorRef.current) {
            const markdown = editorRef.current.innerText ?? '';
            onFinish(markdown);
            setRendered(renderMarkdown(markdown));
        }
    }, [setEdit, editorRef, onFinish]);

    if (!edit) {
        return <div className="editor_frozen" onClick={() => setEdit(true)} dangerouslySetInnerHTML={{ __html: rendered }} />;
    }

    return <div className="editor" >
        <div className="editor-content" contentEditable ref={editorRef}>
            {markdown}
        </div>
        <div className="editor-actions">
            <IconButton icon="save" text="Save" onClick={save} />
            <IconButton icon="cancel" text="Cancel" onClick={cancel} />
        </div>
    </div>;
}

function replaceNested (marker: string, open: string, close: string, markdown: string) {
    let result = "";
    let pos = 0;
    while(pos < markdown.length) {
        const startMarker = markdown.indexOf(marker, pos);
        if (startMarker === -1) {
            break;
        }

        const endMarker = markdown.indexOf(marker, startMarker);
        if (endMarker === -1) {
            // TODO: Who will catch this?
            throw new Error('Unterminated ' + marker);
        }

        result += markdown.slice(pos, startMarker);
        result += open;
        result += markdown.slice(startMarker + marker.length, endMarker);
        pos = endMarker + marker.length;
    }

    result += markdown.slice(pos);

    return result;
}

function renderLine(markdown: string): string {
    return replaceNested('`', '<code>', '</code>',
        replaceNested('*', '<b>', '</b>', 
            replaceNested('_', '<i>', '</i>', markdown)));
}

function renderMarkdown(markdown: string): string {
    let result = "";

    for (const line of markdown.split('\n')) {
        if (line.startsWith('#')) {
            result += `<h1>${renderLine(line.slice(1))}</h1>`;
        } else {
            result += renderLine(line) + '<br>';
        }
    }

    console.log('Rendered Markdown', markdown, result);

    return result;
}