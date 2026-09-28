import { App, PluginSettingTab, Setting } from "obsidian";
import { appHasWeeklyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import type LeftoversPlugin from "./main";

export const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";

export interface LeftoversSettings {
	/** Moment format for weekly note filenames, used when Periodic Notes and Calendar aren't installed. */
	weeklyNoteFormat: string;
}

export const DEFAULT_SETTINGS: LeftoversSettings = {
	weeklyNoteFormat: DEFAULT_WEEKLY_NOTE_FORMAT,
};

export class LeftoversSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: LeftoversPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const setting = new Setting(containerEl).setName("Weekly note format");

		if (appHasWeeklyNotesPluginLoaded()) {
			setting
				.setDesc("Weekly notes are detected using the format set in the Periodic Notes or Calendar plugin.")
				.addText((text) => text.setValue(this.plugin.settings.weeklyNoteFormat).setDisabled(true));
			return;
		}

		let sample!: HTMLElement;
		const desc = createFragment((frag) => {
			frag.appendText("Notes named with this date format anywhere in the vault are weekly notes. ");
			frag.createEl("a", {
				text: "Format reference",
				href: "https://momentjs.com/docs/#/displaying/format/",
			});
			frag.createEl("br");
			frag.appendText("This week's note: ");
			sample = frag.createEl("b", { cls: "u-pop" });
		});

		setting.setDesc(desc).addMomentFormat((format) =>
			format
				.setDefaultFormat(DEFAULT_WEEKLY_NOTE_FORMAT)
				.setValue(this.plugin.settings.weeklyNoteFormat)
				.setSampleEl(sample)
				.onChange(async (value) => {
					this.plugin.settings.weeklyNoteFormat = value.trim() || DEFAULT_WEEKLY_NOTE_FORMAT;
					await this.plugin.saveSettings();
				}),
		);
	}
}
