// Pure text logic for finding and removing unfinished tasks. No Obsidian imports,
// so it can be unit-tested directly.

const UNCHECKED_TASK = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[ \](?:[ \t]|$)/;
const FENCE = /^[ \t]*(`{3,}|~{3,})/;
const TAB_WIDTH = 4;

export interface ExtractResult {
	/** The note content with the unfinished task blocks removed. */
	kept: string;
	/** Each unfinished task together with its indented children, dedented to top level. */
	moved: string[];
}

function stripCR(line: string): string {
	return line.endsWith("\r") ? line.slice(0, -1) : line;
}

function isBlank(line: string): boolean {
	return line.trim().length === 0;
}

function indentWidth(line: string): number {
	let width = 0;
	for (const ch of line) {
		if (ch === " ") width += 1;
		else if (ch === "\t") width += TAB_WIDTH;
		else break;
	}
	return width;
}

/** Removes up to `columns` columns of leading whitespace. */
function dedent(line: string, columns: number): string {
	let width = 0;
	let i = 0;
	while (i < line.length && width < columns) {
		if (line[i] === " ") width += 1;
		else if (line[i] === "\t") width += TAB_WIDTH;
		else break;
		i++;
	}
	return line.slice(i);
}

/** Returns the index of the line closing the frontmatter, or -1 if there is none. */
function frontmatterEnd(lines: string[]): number {
	if (lines.length === 0 || stripCR(lines[0]).trim() !== "---") return -1;
	for (let i = 1; i < lines.length; i++) {
		const line = stripCR(lines[i]).trim();
		if (line === "---" || line === "...") return i;
	}
	return -1;
}

/** Returns the index just past the block that starts with the task at `start`. */
function blockEnd(lines: string[], start: number): number {
	const base = indentWidth(lines[start]);
	let end = start + 1;
	while (end < lines.length) {
		if (isBlank(lines[end])) {
			// Blank lines belong to the block only if deeper content follows them.
			let next = end;
			while (next < lines.length && isBlank(lines[next])) next++;
			if (next < lines.length && indentWidth(lines[next]) > base) {
				end = next;
				continue;
			}
			break;
		}
		if (indentWidth(lines[end]) <= base) break;
		end++;
	}
	return end;
}

export function extractLeftovers(content: string): ExtractResult {
	const lines = content.split("\n");
	const kept: string[] = [];
	const moved: string[] = [];

	let i = 0;
	const fmEnd = frontmatterEnd(lines);
	if (fmEnd >= 0) {
		kept.push(...lines.slice(0, fmEnd + 1));
		i = fmEnd + 1;
	}

	let fence: string | null = null;
	while (i < lines.length) {
		const line = stripCR(lines[i]);

		if (fence) {
			const close = FENCE.exec(line);
			if (close && close[1][0] === fence[0] && close[1].length >= fence.length && line.trim() === close[1]) {
				fence = null;
			}
			kept.push(lines[i]);
			i++;
			continue;
		}

		if (UNCHECKED_TASK.test(line)) {
			const end = blockEnd(lines, i);
			const base = indentWidth(line);
			moved.push(
				lines
					.slice(i, end)
					.map((l) => dedent(stripCR(l), base))
					.join("\n"),
			);
			i = end;
			continue;
		}

		const open = FENCE.exec(line);
		if (open) fence = open[1];
		kept.push(lines[i]);
		i++;
	}

	return { kept: moved.length > 0 ? kept.join("\n") : content, moved };
}
