const DB_KEY = 'vokabel_trainer_db';

export async function saveToIndexedDB(data: Uint8Array): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readwrite');
		const store = tx.objectStore('databases');
		const request = store.put(data, DB_KEY);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function loadFromIndexedDB(): Promise<Uint8Array | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('databases', 'readonly');
		const store = tx.objectStore('databases');
		const request = store.get(DB_KEY);
		request.onsuccess = () => resolve(request.result ?? null);
		request.onerror = () => reject(request.error);
	});
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('VokabelTrainer', 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore('databases');
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
