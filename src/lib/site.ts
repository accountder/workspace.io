export type CategoryName =
	| '财税自动化'
	| '财务分析'
	| '技术工具'
	| '技术笔记'
	| '生活记录';

type Palette = {
	/** 亮色主题下的文字色 */
	fg: string;
	/** 亮色主题下的底色 */
	bg: string;
	/** 暗色主题下的文字色 */
	dfg: string;
	/** 暗色主题下的底色 */
	dbg: string;
};

/**
 * 分类配色：文字色 vs 底色都按 WCAG AA（≥4.5:1）挑过，
 * 亮暗各一套，避免在暗色卡片上出现「几乎看不见的浅色药丸」。
 */
export const CATEGORY_META: Record<string, Palette> = {
	财税自动化: { fg: '#1a56c4', bg: '#e8f1ff', dfg: '#8fb4ff', dbg: 'rgba(64,120,255,0.16)' },
	财务分析: { fg: '#0f7350', bg: '#e4f6ee', dfg: '#63d6ab', dbg: 'rgba(15,115,80,0.22)' },
	技术工具: { fg: '#6a35c9', bg: '#f0eaff', dfg: '#bda4ff', dbg: 'rgba(106,53,201,0.24)' },
	技术笔记: { fg: '#475061', bg: '#eef0f5', dfg: '#a7b1c2', dbg: 'rgba(148,163,184,0.16)' },
	生活记录: { fg: '#a2540a', bg: '#fdf1e3', dfg: '#f0b273', dbg: 'rgba(162,84,10,0.22)' },
};

const FALLBACK: Palette = { fg: '#475061', bg: '#eef0f5', dfg: '#a7b1c2', dbg: 'rgba(148,163,184,0.16)' };

export function categoryStyle(category?: string): string {
	const p = (category && CATEGORY_META[category]) || FALLBACK;
	return `--tag-fg:${p.fg};--tag-bg:${p.bg};--tag-dfg:${p.dfg};--tag-dbg:${p.dbg}`;
}

export function categoryLabel(category?: string): string {
	return category || '综合';
}

/**
 * 中文阅读时长的粗略估算：中文按 380 字/分钟，代码与英文按 200 词/分钟。
 * 目的是给读者一个「要不要现在读」的预期，不追求精确。
 */
export function readingTime(body?: string): number {
	if (!body) return 1;
	const cjk = (body.match(/[\u4e00-\u9fa5]/g) || []).length;
	const words = (body.match(/[A-Za-z0-9_]+/g) || []).length;
	return Math.max(1, Math.round(cjk / 380 + words / 200));
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});
}
