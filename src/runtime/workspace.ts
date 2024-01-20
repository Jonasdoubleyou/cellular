
// The Cellular Workspaces encapsulates models and files

import { CellularModel } from "../model/model";
import { waitForIDB } from "../utils/indexedDB";
import { BrowserFileStorage, FileStore } from "./filestore";

const STORAGE_VERSION = 1;
const MODEL_DB = "models";

class BrowserModelStorage {
    constructor(private database: IDBDatabase) {}

    private getStore() {
        return this.database.transaction(MODEL_DB, "readwrite").objectStore(MODEL_DB);
    }

    async getModelTitles(): Promise<string[]> {
        return (await waitForIDB(this.getStore().getAllKeys())).map(it => it.toString());
    }

    async getModel(title: string): Promise<CellularModel> {
        return await waitForIDB(this.getStore().get(title));
    }

    async storeModel(model: CellularModel) {
        await waitForIDB(
            this.getStore().add(model, model.title)
        );
    }
}

// and allows users to separate data (i.e. by project)
export class Workspace {
    private constructor(
        readonly name: string,
        private files: FileStore,
        private models: BrowserModelStorage
    ) { }

    getFiles(): FileStore { return this.files; }
    getModels(): BrowserModelStorage { return this.models; }

    static async getWorkspaces(): Promise<string[]> {
        return (await indexedDB.databases()).map(it => it.name!);
    }

    static async loadWorkspace(name: string): Promise<Workspace> {
        const openDB = indexedDB.open(name, STORAGE_VERSION);

        openDB.onupgradeneeded = () => {
                console.log("Upgrading IndexedDB");

                openDB.result.createObjectStore("files");
                openDB.result.createObjectStore("models");

                console.log("Finished Upgrading IndexedDB");
        };

        const db = await waitForIDB(openDB);
        console.log("Initializing IndexedDB"); 
        
        const fileStore = await FileStore.from(new BrowserFileStorage(db));
        const modelStore = new BrowserModelStorage(db);

        return new Workspace(
            name,
            fileStore,
            modelStore,
        );
    }
}