/**
 * The default post author. The /admin editor stamps these onto every post it
 * saves instead of asking, since this blog has a single writer.
 *
 * `role` is still part of the post schema and is rendered on the author pages
 * and the about page, so it lives here rather than being dropped — adding a
 * second writer later only means editing the post's frontmatter, not undoing a
 * schema change.
 */
export const defaultAuthor = {
  name: "vedivero",
  role: "Developer",
};
