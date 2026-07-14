import type { Rating } from '$lib/types';

export interface SM2Result {
	ease: number;
	interval: number;
	repetitions: number;
	due_date: string;
}

export function sm2(ease: number, interval: number, repetitions: number, rating: Rating): SM2Result {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	switch (rating) {
		case 'again': {
			const newEase = Math.max(1.3, ease - 0.2);
			return {
				ease: newEase,
				interval: 0,
				repetitions: 0,
				due_date: dateToString(today)
			};
		}
		case 'hard': {
			const newInterval = Math.max(1, Math.round(interval * 1.15));
			const newEase = Math.max(1.3, ease - 0.15);
			return {
				ease: newEase,
				interval: newInterval,
				repetitions: repetitions + 1,
				due_date: dateToString(addDays(today, newInterval))
			};
		}
		case 'good': {
			let newInterval: number;
			if (repetitions === 0) {
				newInterval = 1;
			} else if (repetitions === 1) {
				newInterval = 3;
			} else {
				newInterval = Math.round(interval * ease);
			}
			return {
				ease,
				interval: newInterval,
				repetitions: repetitions + 1,
				due_date: dateToString(addDays(today, newInterval))
			};
		}
		case 'easy': {
			let newInterval: number;
			if (repetitions === 0) {
				newInterval = 2;
			} else if (repetitions === 1) {
				newInterval = 5;
			} else {
				newInterval = Math.round(interval * ease * 1.3);
			}
			const newEase = ease + 0.15;
			return {
				ease: newEase,
				interval: newInterval,
				repetitions: repetitions + 1,
				due_date: dateToString(addDays(today, newInterval))
			};
		}
	}
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function dateToString(date: Date): string {
	return date.toISOString().split('T')[0];
}
