import { useState } from "react";

export function DropZone({ children, onFile }: React.PropsWithChildren<{ onFile: (file: File) => void }>) {
    function onDrop(event: DragEvent) {
        event.preventDefault();

        if (event.dataTransfer?.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (const item of event.dataTransfer.items) {
              // If dropped items aren't files, reject them
              if (item.kind === "file") {
                const file = item.getAsFile()!;
                onFile(file);
              }
            }
        } 
    }

    function onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    return <div onDrop={onDrop as any} onDragOver={onDragOver as any}>
        {children}
    </div>;
}