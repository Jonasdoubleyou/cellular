import { useCallback, useRef, useState } from "react";
import "./Editable.css";

import { IconButton } from "./Icons";

export function Editable({ text, onFinish }: { text: string, onFinish: (newText: string) => void }) {
    const [edit, setEdit] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    const cancel = useCallback(() => {
        if (!edit) return;

        setEdit(false);
        textRef.current!.textContent = text;
    }, [edit, text, setEdit, textRef]);

    const save = useCallback(() => {
        if (!edit) return;

        setEdit(false);
        if (textRef.current) {
            onFinish(textRef.current.textContent ?? '');
            textRef.current.blur();
        }
    }, [edit, setEdit, textRef, onFinish]);

    const handleEnter = useCallback((event: React.KeyboardEvent) => {
        if (event.key == 'Enter') {
            event.preventDefault();
            save();
        }
    }, [save]);

    return <div className="editable">
        <div className="editable-text" contentEditable ref={textRef} onFocus={() => setEdit(true)} onKeyDown={handleEnter}>
            {text}
        </div>
        {edit && <>
            <IconButton small icon="save" onClick={save} />
            <IconButton small icon="cancel" onClick={cancel} />
        </>}
    </div>;
}