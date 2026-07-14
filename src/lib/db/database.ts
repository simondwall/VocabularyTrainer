import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { sm2 } from './sm2';
import { saveToIndexedDB, loadFromIndexedDB } from './storage';
import type { Card, Rating, Stats } from '$lib/types';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let db: SqlJsDatabase | null = null;
let initPromise: Promise<void> | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
	if (saveTimeout) clearTimeout(saveTimeout);
	saveTimeout = setTimeout(async () => {
		if (db) {
			const data = db.export();
			await saveToIndexedDB(data);
		}
	}, 500);
}

export async function initDatabase(basePath?: string): Promise<void> {
	if (db) return;
	if (initPromise) return initPromise;

	const wasmBase = (basePath || '').replace(/\/$/, '');

	initPromise = (async () => {
		SQL = await initSqlJs({
			locateFile: (file) => `${wasmBase}/${file}`
		});

		const saved = await loadFromIndexedDB();
		if (saved) {
			db = new SQL.Database(saved);
		} else {
			db = new SQL.Database();
		}

		if (!tableExists('cards')) {
			createSchema();
		}
		migrateSchema();
		scheduleSave();
	})();

	try {
		await initPromise;
	} catch (e) {
		initPromise = null;
		throw e;
	}
}

function tableExists(name: string): boolean {
	if (!db) return false;
	const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [name]);
	return result.length > 0 && result[0].values.length > 0;
}

function columnExists(column: string): boolean {
	if (!db) return false;
	const info = db.exec('PRAGMA table_info(cards)');
	if (info.length === 0) return false;
	return info[0].values.some((row) => row[1] === column);
}

function migrateSchema() {
	if (!db) return;

	if (!tableExists('tags')) {
		db.run('CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)');
	}

	if (!tableExists('card_tags')) {
		db.run('CREATE TABLE IF NOT EXISTS card_tags (card_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (card_id, tag_id))');
	}

	const existingCount = db.exec('SELECT COUNT(*) as c FROM card_tags')[0]?.values[0]?.[0] as number ?? 0;
	if (existingCount > 0) return;

	const oldRows = db.exec('SELECT id, tags FROM cards WHERE tags IS NOT NULL AND tags != ""');
	if (oldRows.length === 0) return;

	for (const row of oldRows[0].values) {
		const cardId = row[0] as number;
		for (const t of (row[1] as string).split(',')) {
			const name = t.trim();
			if (!name) continue;
			db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
			const tagId = db.exec('SELECT id FROM tags WHERE name = ?', [name])[0].values[0][0] as number;
			db.run('INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?, ?)', [cardId, tagId]);
		}
	}
}

function createSchema() {
	if (!db) return;
	db.run(`
		CREATE TABLE IF NOT EXISTS cards (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			front TEXT NOT NULL,
			back TEXT NOT NULL,
			tags TEXT NOT NULL DEFAULT '',
			ease REAL DEFAULT 2.0,
			interval INTEGER DEFAULT 0,
			repetitions INTEGER DEFAULT 0,
			due_date TEXT NOT NULL DEFAULT (date('now')),
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		)
	`);
	db.run(`
		CREATE TABLE IF NOT EXISTS tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		)
	`);
	db.run(`
		CREATE TABLE IF NOT EXISTS card_tags (
			card_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			PRIMARY KEY (card_id, tag_id)
		)
	`);
}

const CARD_SELECT = `
	SELECT c.*, COALESCE(GROUP_CONCAT(t.name, ','), '') as tags
	FROM cards c
	LEFT JOIN card_tags ct ON ct.card_id = c.id
	LEFT JOIN tags t ON t.id = ct.tag_id
`;

function rowToCard(row: Record<string, unknown>): Card {
	return {
		id: row.id as number,
		front: row.front as string,
		back: row.back as string,
		tags: (row.tags as string) || '',
		ease: row.ease as number,
		interval: row.interval as number,
		repetitions: row.repetitions as number,
		due_date: row.due_date as string,
		created_at: row.created_at as string,
		updated_at: row.updated_at as string,
	};
}

function syncCardTags(cardId: number, tagNames: string[]) {
	if (!db) return;

	db.run('DELETE FROM card_tags WHERE card_id = ?', [cardId]);

	const csv = tagNames.join(',');
	db.run("UPDATE cards SET tags = ? WHERE id = ?", [csv, cardId]);

	for (const name of tagNames) {
		if (!name.trim()) continue;
		db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name.trim()]);
		const tagId = (db.exec('SELECT id FROM tags WHERE name = ?', [name.trim()])[0].values[0][0] as number);
		db.run('INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?, ?)', [cardId, tagId]);
	}
}

export function getDueCards(): Card[] {
	if (!db) return [];
	const today = new Date().toISOString().split('T')[0];
	const sql = `${CARD_SELECT} WHERE c.due_date <= ? GROUP BY c.id ORDER BY c.due_date ASC, c.id ASC`;
	const stmt = db.prepare(sql);
	stmt.bind([today]);
	const cards: Card[] = [];
	while (stmt.step()) {
		cards.push(rowToCard(stmt.getAsObject() as Record<string, unknown>));
	}
	stmt.free();
	return cards;
}

export function getAllCards(): Card[] {
	if (!db) return [];
	const sql = `${CARD_SELECT} GROUP BY c.id ORDER BY c.created_at DESC`;
	const stmt = db.prepare(sql);
	const cards: Card[] = [];
	while (stmt.step()) {
		cards.push(rowToCard(stmt.getAsObject() as Record<string, unknown>));
	}
	stmt.free();
	return cards;
}

export function getCard(id: number): Card | null {
	if (!db) return null;
	const sql = `${CARD_SELECT} WHERE c.id = ? GROUP BY c.id`;
	const stmt = db.prepare(sql);
	stmt.bind([id]);
	if (stmt.step()) {
		const card = rowToCard(stmt.getAsObject() as Record<string, unknown>);
		stmt.free();
		return card;
	}
	stmt.free();
	return null;
}

export function addCard(front: string, back: string, tags: string[]): number {
	if (!db) return 0;
	db.run('INSERT INTO cards (front, back) VALUES (?, ?)', [front, back]);
	const id = (db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number);
	syncCardTags(id, tags);
	scheduleSave();
	return id;
}

export function updateCard(id: number, front: string, back: string, tags: string[]): void {
	if (!db) return;
	db.run(
		"UPDATE cards SET front = ?, back = ?, updated_at = datetime('now') WHERE id = ?",
		[front, back, id]
	);
	syncCardTags(id, tags);
	scheduleSave();
}

export function deleteCard(id: number): void {
	if (!db) return;
	db.run('DELETE FROM card_tags WHERE card_id = ?', [id]);
	db.run('DELETE FROM cards WHERE id = ?', [id]);
	scheduleSave();
}

export function reviewCard(id: number, rating: Rating): void {
	if (!db) return;
	const card = getCard(id);
	if (!card) return;

	const result = sm2(card.ease, card.interval, card.repetitions, rating);
	db.run(
		"UPDATE cards SET ease = ?, interval = ?, repetitions = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?",
		[result.ease, result.interval, result.repetitions, result.due_date, id]
	);
	scheduleSave();
}

export function getStats(): Stats {
	if (!db) return { total: 0, due: 0, learned: 0, newCards: 0 };
	const today = new Date().toISOString().split('T')[0];

	const totalResult = db.exec('SELECT COUNT(*) as count FROM cards');
	const total = totalResult[0]?.values[0]?.[0] as number ?? 0;

	const dueResult = db.exec(`SELECT COUNT(*) as count FROM cards WHERE due_date <= '${today}'`);
	const due = dueResult[0]?.values[0]?.[0] as number ?? 0;

	const learnedResult = db.exec('SELECT COUNT(*) as count FROM cards WHERE repetitions > 0');
	const learned = learnedResult[0]?.values[0]?.[0] as number ?? 0;

	const newResult = db.exec('SELECT COUNT(*) as count FROM cards WHERE repetitions = 0');
	const newCards = newResult[0]?.values[0]?.[0] as number ?? 0;

	return { total, due, learned, newCards };
}

export function getAllTags(): string[] {
	if (!db) return [];
	const result = db.exec('SELECT name FROM tags ORDER BY name');
	if (result.length === 0) return [];
	return result[0].values.map((r) => r[0] as string);
}

export function exportDatabase(): Uint8Array | null {
	if (!db) return null;
	return db.export();
}

export async function importDatabase(data: Uint8Array): Promise<void> {
	if (!SQL) throw new Error('Database not initialized');
	db = new SQL.Database(data);
	if (!tableExists('cards')) {
		createSchema();
	}
	migrateSchema();
	scheduleSave();
}

export function closeDatabase(): void {
	if (db) db.close();
}
