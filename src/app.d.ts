// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
		showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
	}

	interface FileSystemFileHandle {
		queryPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
		requestPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
		getFile(): Promise<File>;
		createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
	}

	interface FileSystemWritableFileStream extends WritableStream {
		write(data: ArrayBuffer | ArrayBufferView | Blob | string): Promise<void>;
		seek(position: number): Promise<void>;
		truncate(size: number): Promise<void>;
	}

	interface OpenFilePickerOptions {
		multiple?: boolean;
		types?: FilePickerAcceptType[];
		excludeAcceptAllOption?: boolean;
	}

	interface SaveFilePickerOptions {
		suggestedName?: string;
		types?: FilePickerAcceptType[];
		excludeAcceptAllOption?: boolean;
	}

	interface FilePickerAcceptType {
		description?: string;
		accept: Record<string, string | string[]>;
	}
}

export {};
