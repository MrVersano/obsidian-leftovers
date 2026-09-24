import { describe, expect, it } from "vitest";
import { extractLeftovers } from "./leftovers";

const md = (...lines: string[]) => lines.join("\n");

describe("extractLeftovers", () => {
	it("moves flat unchecked tasks and keeps checked ones", () => {
		const { kept, moved } = extractLeftovers(
			md("# Tasks", "- [ ] one", "- [x] done", "- [ ] two", "notes"),
		);
		expect(moved).toEqual(["- [ ] one", "- [ ] two"]);
		expect(kept).toBe(md("# Tasks", "- [x] done", "notes"));
	});

	it("leaves other statuses in place", () => {
		const content = md("- [X] a", "- [-] b", "- [>] c", "- [/] d");
		const { kept, moved } = extractLeftovers(content);
		expect(moved).toEqual([]);
		expect(kept).toBe(content);
	});

	it("moves an unchecked task with all its children as one block", () => {
		const { kept, moved } = extractLeftovers(
			md("- [ ] parent", "  - [x] done child", "  - [ ] open child", "    detail", "- [x] other"),
		);
		expect(moved).toEqual([md("- [ ] parent", "  - [x] done child", "  - [ ] open child", "    detail")]);
		expect(kept).toBe("- [x] other");
	});

	it("moves an unchecked child of a checked parent on its own, dedented", () => {
		const { kept, moved } = extractLeftovers(
			md("- [x] parent", "  - [ ] child", "    - note", "  - [x] sibling"),
		);
		expect(moved).toEqual([md("- [ ] child", "  - note")]);
		expect(kept).toBe(md("- [x] parent", "  - [x] sibling"));
	});

	it("handles numbered lists and other bullet markers", () => {
		const { moved } = extractLeftovers(md("1. [ ] a", "2) [ ] b", "* [ ] c", "+ [ ] d"));
		expect(moved).toEqual(["1. [ ] a", "2) [ ] b", "* [ ] c", "+ [ ] d"]);
	});

	it("ignores tasks in frontmatter and code fences", () => {
		const content = md("---", "x: - [ ] nope", "---", "```", "- [ ] code", "```", "~~~~", "- [ ] tilde", "~~~~");
		const { kept, moved } = extractLeftovers(content);
		expect(moved).toEqual([]);
		expect(kept).toBe(content);
	});

	it("still finds tasks after a closed fence", () => {
		const { moved } = extractLeftovers(md("```", "- [ ] code", "```", "- [ ] real"));
		expect(moved).toEqual(["- [ ] real"]);
	});

	it("includes blank lines inside a block but not trailing ones", () => {
		const { kept, moved } = extractLeftovers(md("- [ ] task", "", "  child", "", "after"));
		expect(moved).toEqual([md("- [ ] task", "", "  child")]);
		expect(kept).toBe(md("", "after"));
	});

	it("handles tab indentation", () => {
		const { kept, moved } = extractLeftovers(md("- [x] parent", "\t- [ ] child", "\t\t- grandchild"));
		expect(moved).toEqual([md("- [ ] child", "\t- grandchild")]);
		expect(kept).toBe("- [x] parent");
	});

	it("preserves CRLF line endings in kept content", () => {
		const { kept, moved } = extractLeftovers("a\r\n- [ ] t\r\nb\r\n");
		expect(moved).toEqual(["- [ ] t"]);
		expect(kept).toBe("a\r\nb\r\n");
	});

	it("matches an empty task", () => {
		expect(extractLeftovers("- [ ]").moved).toEqual(["- [ ]"]);
	});
});
