# Leftovers

An Obsidian plugin that moves unfinished checkboxes from previous daily notes into the note you're working on.

## Usage

1. Open a daily note.
2. Put the cursor where you want the tasks.
3. Run **Leftovers: Pull unfinished tasks into this note** from the command palette.

Every unchecked task (`- [ ]`) from daily notes dated *before* the current note is inserted at the cursor, oldest first, and removed from the note it came from. Indented children (sub-tasks, notes) move with their parent task.

- The command only appears when the active file is a daily note. Daily notes are detected from the core **Daily Notes** plugin's folder and date format (Periodic Notes is supported too).
- Daily notes dated after the current note are never touched.
- Only `[ ]` counts as unfinished. `[x]`, `[-]`, `[>]` and other statuses stay where they are.
- Tasks inside frontmatter and code blocks are ignored.

> **Note:** Undo (Ctrl/Cmd+Z) removes the inserted tasks from the current note, but it does **not** restore them in the previous notes.

## Development

```sh
npm install
npm run dev     # watch build
npm run build   # production build → main.js
npm test        # unit tests
```

To try it, copy or symlink `main.js` and `manifest.json` into `<vault>/.obsidian/plugins/leftovers/`, then enable the plugin in **Settings → Community plugins**.

## Releasing

1. Bump `version` in `manifest.json` and `package.json`, and add the new version to `versions.json`.
2. Commit, then tag the commit with the exact version (no `v` prefix) and push the tag:

   ```sh
   git tag 1.0.1 && git push origin 1.0.1
   ```

The Release workflow builds the plugin and publishes a GitHub release with `main.js` and `manifest.json` attached.
