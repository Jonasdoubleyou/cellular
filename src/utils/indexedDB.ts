export function waitForIDB<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}
