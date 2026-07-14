export interface Card {
	id: number;
	front: string;
	back: string;
	tags: string;
	ease: number;
	interval: number;
	repetitions: number;
	due_date: string;
	created_at: string;
	updated_at: string;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Stats {
	total: number;
	due: number;
	learned: number;
	newCards: number;
}

export type AppState = 'loading' | 'file-picker' | 'migration' | 'permission-needed' | 'ready' | 'error';
