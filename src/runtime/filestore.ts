import { FileName, FilePath, FileSourceType, isSourceType } from "../model/block";
import { waitForIDB } from "../utils/indexedDB";

// The File Storage allows users to upload Files into their Cellular Workspace
// and work with them across models. The storage stores them in the browser, and loads
// them in memory on demand

const FILES_DB = "files";

function detectType(type: string, data: ArrayBuffer): FileSourceType | never {
    if (type === "text/csv") {
        return "csv";
    }

    if (type === "application/json") {
        return "json";
    }

    throw new Error(`Unsupported File Type ${type}`);
}

// The underlying storage as an IndexedDB Object Store
export class BrowserFileStorage {
    constructor(private database: IDBDatabase) {}

    private getStore() {
        return this.database.transaction(FILES_DB, "readwrite").objectStore(FILES_DB);
    }
    
    async getFullPaths(): Promise<string[]> {
        return (await waitForIDB(this.getStore().getAllKeys())).map(it => it.toString());
    }

    async getFileData(fullPath: string): Promise<ArrayBuffer> {
        return await waitForIDB(this.getStore().get(fullPath));
    }

    async storeFileData(fullPath: string, data: ArrayBuffer) {
        await waitForIDB(
            this.getStore().add(data, fullPath)
        );
    }
}

export class File {
    // A file is uniquely identified by path and name in the file storage
    constructor(
        public readonly name: FileName,
        public readonly sourcetype: FileSourceType,
        public readonly path: FilePath) {
            if (name.includes("/") || name.includes(".")) {
                throw new Error(`File names may not include / or .`);
            }
        }

    fullPath(): string {
        return `${this.path.endsWith("/") ? this.path : this.path + "/"}${this.name}.${this.sourcetype}`;
    }

    deriveVariableName(): string {
        return this.name.split(".")[0];
    }

    static fromFullPath(fullPath: string): File {
        const lastSlash = fullPath.lastIndexOf("/");
        const path = fullPath.slice(0, lastSlash);
        const [name, sourceType] = fullPath.slice(lastSlash + 1).split(".");

        if (!isSourceType(sourceType)) {
            throw new Error(`Invalid Source Type '${sourceType}'`);
        }

        return new File(name, sourceType, path);
    }
}

export class Folder {
    private files: { [name: string]: File } = {};
    private subfolders: { [name: string]: Folder } = {};
    private onChangeHandlers: ((folder: Folder) => void)[] = [];

    constructor(readonly name: string) {}

    hasFile(name: string) { return name in this.files; }

    getFiles(): File[] { return Object.values(this.files); }

    getFile(name: string) {
        if (!(name in this.files)) {
            throw new Error(`No File '${name}' found`);
        }

        return this.files[name];
    }

    addFile(file: File) {
        if (file.name in this.files) {
            throw new Error(`Cannot add File '${file.name}' as it already exists`);
        }

        this.files[file.name] = file;

        this._didChange();
    }

    hasFolder(name: string): boolean { return name in this.subfolders; }

    getSubFolders(): Folder[] {
        return Object.values(this.subfolders);
    }

    getFolder(name: string): Folder | never {
        if (!(name in this.subfolders)) {
            throw new Error(`No Folder '${name}' found`);
        }

        return this.subfolders[name];
    }

    createFolder(name: string): Folder | never {
        if (name.includes("/")) {
            throw new Error(`Folder names may not include /`);
        }

        if (this.hasFolder(name)) {
            throw new Error(`Cannot create Folder '${name}' as it already exists`);
        }

        const result = this.subfolders[name] = new Folder(name);
        this._didChange();

        return result;
    }

    onChange(handler: (folder: Folder) => void) { 
        this.onChangeHandlers.push(handler);
        return () => { this.onChangeHandlers = this.onChangeHandlers.filter(it => it !== handler) };
    }

    _didChange() {
        this.onChangeHandlers.forEach(it => it(this));
    }
}

export class FileStore {
    private root: Folder = new Folder("");

    private constructor(private storage: BrowserFileStorage) {}

    getRoot(): Folder { return this.root; };

    getFile(path: string, name: string): File | never {
        return this.getFolder(path).getFile(name);
    }

    getFolder(path: string, create = false): Folder | never {
        if (!path.startsWith("/")) {
            throw new Error(`Only absolute paths are supported`);
        }

        try {
            const pathSteps = path.split("/").slice(1).filter(it => it.length);
            let currentFolder = this.root;
            for (const step of pathSteps) {
                if (create && !currentFolder.hasFolder(step)) {
                    currentFolder = currentFolder.createFolder(step);
                } else {
                    currentFolder = currentFolder.getFolder(step);
                }
            }

            return currentFolder;
        } catch(error) {
            throw new Error(`Could not resolve path '${path}': ${(error as Error).message}`);
        } 
    }

    addFile(file: File) {
        this.getFolder(file.path, /* create */ true).addFile(file);
    }

    hasFile(file: File) {
        return this.getFolder(file.path).hasFile(file.name);
    }

    async addBrowserFile(file: globalThis.File) {
        console.log(file);
    
        const buffer = await file.arrayBuffer();
        const type = detectType(file.type, buffer);
        const name = file.name.split(".")[0];

        const resultFile = new File(name, type, "/");
        console.log(resultFile);

        this.addFile(resultFile);
        this.storeFileData(resultFile, buffer);
    }

    async storeFileData(file: File, data: ArrayBuffer) {
        if (!this.hasFile(file)) {
            throw new Error(`Cannot store data for file that does not exist in the store`);
        }

        await this.storage.storeFileData(file.fullPath(), data);
    }

    async getFileData(file: File, data: ArrayBuffer) {
        if (!this.hasFile(file)) {
            throw new Error(`Cannot get data for file that does not exist in the store`);
        }
        
        await this.storage.getFileData(file.fullPath());
    }

    static async from(browserFileStorage: BrowserFileStorage): Promise<FileStore> {
        const result = new FileStore(browserFileStorage);

        for (const fullPath of await browserFileStorage.getFullPaths()) {
            const file = File.fromFullPath(fullPath);
            result.addFile(file);
        }

        return result;
    }

}