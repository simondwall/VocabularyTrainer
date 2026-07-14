const HANDLE_KEY = 'file_handle';
const LEGACY_DATA_KEY = 'vokabel_trainer_db';

export async function saveHandle(handle: FileSystemFileHandle): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readwrite');
		const store = tx.objectStore('databases');
		const request = store.put(handle, HANDLE_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function loadHandle(): Promise<FileSystemFileHandle | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readonly');
		const store = tx.objectStore('databases');
		const request = store.get(HANDLE_KEY);
		request.onsuccess = () => resolve(request.result ?? null);
		request.onerror = () => reject(request.error);
	});
}

export async function removeHandle(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readwrite');
		const store = tx.objectStore('databases');
		const request = store.delete(HANDLE_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function readFile(handle: FileSystemFileHandle): Promise<Uint8Array> {
	const file = await handle.getFile();
	const buffer = await file.arrayBuffer();
	return new Uint8Array(buffer);
}

export async function writeFile(handle: FileSystemFileHandle, data: Uint8Array): Promise<void> {
	const writable = await handle.createWritable();
	await writable.write(data.buffer as ArrayBuffer);
	await writable.close();
}

export async function loadLegacyData(): Promise<Uint8Array | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readonly');
		const store = tx.objectStore('databases');
		const request = store.get(LEGACY_DATA_KEY);
		request.onsuccess = () => resolve(request.result ?? null);
		request.onerror = () => reject(request.error);
	});
}

export async function removeLegacyData(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readwrite');
		const store = tx.objectStore('databases');
		const request = store.delete(LEGACY_DATA_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('VokabelTrainer', 2);
		request.onupgradeneeded = () => {
			const d = request.result;
			if (!d.objectStoreNames.contains('databases')) {
				d.createObjectStore('databases');
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
