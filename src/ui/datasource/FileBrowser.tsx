import { File, FileStore, Folder } from "../../runtime/filestore";
import { Icon, IconButton } from "../base/Icons";
import { Popup } from "../base/Popup";
import "./FileBrowser.css";

import { TreeNode } from "../base/Tree";
import { useEffect, useRef, useState } from "react";

const ACCEPTED_FILETYPES = [
    "csv",
    "json"
].map(it => "." + it).join(",");

export function UploadFiles({ filestore }: { filestore: FileStore }) {
    const inputRef = useRef<HTMLInputElement>(null);

    async function upload() {
        const { files } = inputRef.current!;
        if (!files) return;

        for (const file of files) {
            await filestore.addBrowserFile(file);
        }
    }


    return <>
        <IconButton icon="add" text="Upload Files" onClick={() => inputRef.current?.click()} />
        <input onChange={upload} ref={inputRef} type="file" multiple accept={ACCEPTED_FILETYPES} style={{ display: "none" }} />
    </>
}

export function FileUI({ file, onChoose }: { file: File, onChoose?: (file: File) => void }) {
    return <button className="file" onClick={onChoose ? () => onChoose(file) : undefined}>
        {file.name}
    </button>
}

export function FolderUI({ folder, onChoose }: { folder: Folder, onChoose?: (file: File) => void }) {
    const [subfolders, setSubFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        setSubFolders(folder.getSubFolders());
        setFiles(folder.getFiles());

        return folder.onChange(() => {
            setSubFolders(folder.getSubFolders());
            setFiles(folder.getFiles());
        });
    }, [folder]);
    
    return <TreeNode name={folder.name}>
        {subfolders.map(it => <FolderUI folder={it} onChoose={onChoose} />)}
        {files.map(it => <FileUI file={it} onChoose={onChoose} />)}
    </TreeNode>
}

export function FileBrowser({ filestore, onClose, onChoose }: { filestore: FileStore, onClose: () => void, onChoose?: (file: File) => void }) {
    return <Popup title="Files" onClose={onClose}>
        <UploadFiles filestore={filestore}/>
        <FolderUI folder={filestore.getRoot()} onChoose={onChoose}/>
    </Popup>
}
