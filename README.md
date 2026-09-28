# Leftovers

Leftovers moves unfinished tasks from previous daily or weekly notes into the note you're working on. Yesterday's open tasks don't get forgotten, and old notes don't pile up with duplicates.

## Installation

In Obsidian, open **Settings → Community plugins → Browse**, search for **Leftovers**, then install and enable it.

To install manually, download `main.js` and `manifest.json` from the [latest release](https://github.com/MrVersano/obsidian-leftovers/releases/latest) into `<vault>/.obsidian/plugins/leftovers/`, then enable Leftovers in **Settings → Community plugins**.

## Usage

1. Open a daily or weekly note.
2. Put the cursor where you want the tasks.
3. Run **Leftovers: Pull unfinished tasks into this note** from the command palette. You can also assign it a hotkey in **Settings → Hotkeys**.

Every unchecked task from earlier notes of the same kind is inserted at the cursor, oldest first, and removed from the note it came from. A daily note pulls from earlier daily notes, and a weekly note from earlier weekly notes.

### Example

Before, in `2026-09-24`:

```markdown
- [x] Send invoices
- [ ] Book dentist
- [ ] Plan launch
  - [x] Draft announcement
  - [ ] Pick a date
```

After running Leftovers in `2026-09-25`, the open tasks move there, along with everything indented under them:

```markdown
- [ ] Book dentist
- [ ] Plan launch
  - [x] Draft announcement
  - [ ] Pick a date
```

`2026-09-24` keeps only `- [x] Send invoices`.

### What gets moved

- Only tasks marked `[ ]` count as unfinished. `[x]`, `[-]`, `[>]` and other statuses stay where they are.
- Anything indented under an unfinished task (sub-tasks, notes) moves with it.
- An unfinished sub-task under a finished task moves on its own and becomes a top-level task.
- Tasks in frontmatter and code blocks are ignored.
- Notes dated after the current note are never touched.

> **Note:** Undo (Ctrl/Cmd+Z) removes the pulled tasks from the current note, but it does **not** put them back in the earlier notes.

## Daily notes

Leftovers uses the folder and date format from Obsidian's core **Daily Notes** plugin, or from **Periodic Notes** if you use it. The command only appears in the command palette when the open note is a daily note.

## Weekly notes

- **With Periodic Notes or Calendar:** Leftovers uses that plugin's weekly note folder and format.
- **Without either:** any note in the vault whose name matches the **Weekly note format** in Leftovers' settings is a weekly note.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| Weekly note format | `gggg-[W]ww` (e.g. `2026-W40`) | The [date format](https://momentjs.com/docs/#/displaying/format/) of weekly note names. Only used when Periodic Notes and Calendar aren't installed. |

## Development

```sh
npm install
npm run dev     # watch build
npm run build   # production build → main.js
npm test        # unit tests
```

To try a local build, symlink this folder into `<vault>/.obsidian/plugins/leftovers/`, then enable the plugin in **Settings → Community plugins**.

## Releasing

1. Bump `version` in `manifest.json` and `package.json`, and add the new version to `versions.json`.
2. Commit, then tag the commit with the exact version (no `v` prefix) and push the tag:

   ```sh
   git tag 1.2.0 && git push origin 1.2.0
   ```

The Release workflow tests and builds the plugin, attests the build, and publishes a GitHub release with `main.js` and `manifest.json` attached.
