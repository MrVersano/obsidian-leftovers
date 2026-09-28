import { Editor, moment, Notice, Plugin, TFile } from "obsidian";
import {
	appHasDailyNotesPluginLoaded,
	appHasWeeklyNotesPluginLoaded,
	getAllDailyNotes,
	getAllWeeklyNotes,
	getDateFromFile,
} from "obsidian-daily-notes-interface";
import { extractLeftovers } from "./leftovers";
import { DEFAULT_SETTINGS, LeftoversSettings, LeftoversSettingTab } from "./settings";

type Moment = ReturnType<typeof moment>;
type Granularity = "day" | "week";

interface Period {
	granularity: Granularity;
	/** The note's date from its filename, or null if the name doesn't match the format. */
	parseDate(file: TFile): Moment | null;
	/** Every note of this period in the vault. */
	notes(): TFile[];
}

export default class LeftoversPlugin extends Plugin {
	settings: LeftoversSettings = { ...DEFAULT_SETTINGS };

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new LeftoversSettingTab(this.app, this));

		this.addCommand({
			id: "pull-unfinished-tasks",
			name: "Pull unfinished tasks into this note",
			editorCheckCallback: (checking, editor, ctx) => {
				const file = ctx.file;
				const period = file && this.periodOf(file);
				if (!file || !period) return false;
				if (!checking) void this.pullLeftovers(file, period, editor);
				return true;
			},
		});
	}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Daily notes come from the core Daily Notes plugin (or Periodic Notes). Weekly notes
	 * follow Periodic Notes or Calendar when installed, and Leftovers' own format otherwise.
	 */
	private periods(): Period[] {
		const periods: Period[] = [];
		if (appHasDailyNotesPluginLoaded()) periods.push(this.pluginPeriod("day", getAllDailyNotes));
		periods.push(
			appHasWeeklyNotesPluginLoaded() ? this.pluginPeriod("week", getAllWeeklyNotes) : this.weeklyPeriod(),
		);
		return periods;
	}

	/** A period whose folder and format come from another plugin's settings. */
	private pluginPeriod(granularity: Granularity, getAll: () => Record<string, TFile>): Period {
		return {
			granularity,
			parseDate: (file) => {
				try {
					return getDateFromFile(file, granularity);
				} catch {
					// The plugin providing this period's settings isn't configured.
					return null;
				}
			},
			notes: () => {
				try {
					return Object.values(getAll());
				} catch {
					// The configured notes folder doesn't exist.
					return [];
				}
			},
		};
	}

	/** Weekly notes named with Leftovers' own format, anywhere in the vault. */
	private weeklyPeriod(): Period {
		// A format can contain folders ("YYYY/gggg-[W]ww"); only the last part is the filename.
		const format = this.settings.weeklyNoteFormat.split("/").pop()!;
		const parseDate = (file: TFile) => {
			const date = moment(file.basename, format, true);
			return date.isValid() ? date : null;
		};
		return {
			granularity: "week",
			parseDate,
			notes: () => this.app.vault.getMarkdownFiles().filter((file) => parseDate(file)),
		};
	}

	/** Returns the period the file is a note for, or null if it isn't a periodic note. */
	private periodOf(file: TFile): Period | null {
		return this.periods().find((period) => period.parseDate(file) && period.notes().includes(file)) ?? null;
	}

	private async pullLeftovers(current: TFile, period: Period, editor: Editor) {
		const currentDate = period.parseDate(current);
		if (!currentDate) return;

		const sources = period
			.notes()
			.map((file) => ({ file, date: period.parseDate(file) }))
			.filter(({ date }) => date?.isBefore(currentDate, period.granularity))
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
