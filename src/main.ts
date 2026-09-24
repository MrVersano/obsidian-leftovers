import { Editor, Notice, Plugin, TFile } from "obsidian";
import {
	appHasDailyNotesPluginLoaded,
	getAllDailyNotes,
	getDateFromFile,
} from "obsidian-daily-notes-interface";
import { extractLeftovers } from "./leftovers";

export default class LeftoversPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "pull-unfinished-tasks",
			name: "Pull unfinished tasks into this note",
			editorCheckCallback: (checking, editor, ctx) => {
				const file = ctx.file;
				if (!file || !this.isDailyNote(file)) return false;
				if (!checking) void this.pullLeftovers(file, editor);
				return true;
			},
		});
	}

	private isDailyNote(file: TFile): boolean {
		if (!appHasDailyNotesPluginLoaded()) return false;
		if (!getDateFromFile(file, "day")) return false;
		return this.dailyNotes().includes(file);
	}

	private dailyNotes(): TFile[] {
		try {
			return Object.values(getAllDailyNotes());
		} catch {
			// The configured daily notes folder doesn't exist.
			return [];
		}
	}

	private async pullLeftovers(current: TFile, editor: Editor) {
		const currentDate = getDateFromFile(current, "day");
		if (!currentDate) return;

		const sources = this.dailyNotes()
			.map((file) => ({ file, date: getDateFromFile(file, "day") }))
			.filter(({ date }) => date?.isBefore(currentDate, "day"))
			.sort((a, b) => a.date!.valueOf() - b.date!.valueOf());

		const blocks: string[] = [];
		let noteCount = 0;
		for (const { file } of sources) {
			await this.app.vault.process(file, (content) => {
				const { kept, moved } = extractLeftovers(content);
				if (moved.length > 0) {
					blocks.push(...moved);
					noteCount++;
				}
				return kept;
			});
		}

		if (blocks.length === 0) {
			new Notice("No leftovers found");
			return;
		}

		editor.replaceSelection(this.formatForInsertion(editor, blocks.join("\n")));
		new Notice(
			`Moved ${blocks.length} task${blocks.length === 1 ? "" : "s"} from ${noteCount} note${noteCount === 1 ? "" : "s"}`,
		);
	}

	/** Puts the tasks on their own lines, even when the cursor is mid-line. */
	private formatForInsertion(editor: Editor, text: string): string {
		const from = editor.getCursor("from");
		const to = editor.getCursor("to");
		if (editor.getLine(from.line).slice(0, from.ch).trim().length > 0) text = "\n" + text;
		if (editor.getLine(to.line).slice(to.ch).trim().length > 0) text += "\n";
		return text;
	}
}
