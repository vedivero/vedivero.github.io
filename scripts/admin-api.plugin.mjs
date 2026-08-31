// Dev-only Vite plugin: powers the local-only editor at /admin (see
// src/pages/admin.astro). `configureServer` is a Vite dev-server hook, so this
// code never runs during `astro build` and ships nothing to the production
// bundle deployed to GitHub Pages.
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const API_PREFIX = "/__admin/api/posts";
const ADMIN_PAGE = "src/pages/admin.astro";
const CATEGORIES_FILE = path.join(process.cwd(), "src/config/categories.ts");
const CATEGORY_API_PREFIX = "/__admin/api/categories";
const IMAGE_API_PREFIX = "/__admin/api/images";

const isValidSlug = (slug) => typeof slug === "string" && SLUG_PATTERN.test(slug);

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

/** Finds the post's markdown file, trying .md then .mdx. */
const findPostFile = async (slug) => {
  for (const ext of ["md", "mdx"]) {
    const file = path.join(POSTS_DIR, slug, `index.${ext}`);
    try {
      await readFile(file, "utf-8");
      return { file, ext };
    } catch {
      // try next extension
    }
  }
  return null;
};

const quote = (value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * Hand-rolled to match the exact frontmatter style already used across
 * src/content/posts (double-quoted strings, bare booleans/dates, optional
 * keys omitted rather than written as false/null).
 */
const toFrontmatter = (data) => {
  const lines = [
    `title: ${quote(data.title)}`,
    `excerpt: ${quote(data.excerpt)}`,
    `category: ${quote(data.category)}`,
    `date: ${data.date}`,
  ];

  if (data.updatedDate) lines.push(`updatedDate: ${data.updatedDate}`);

  lines.push(`author:`, `  name: ${quote(data.author.name)}`, `  role: ${quote(data.author.role)}`);

  if (data.cover?.alt) {
    const coverExt = data.cover.ext || `jpg`;
    lines.push(`cover:`, `  src: "./cover.${coverExt}"`, `  alt: ${quote(data.cover.alt)}`);
    if (data.cover.creditName) lines.push(`  creditName: ${quote(data.cover.creditName)}`);
    if (data.cover.creditUrl) lines.push(`  creditUrl: ${quote(data.cover.creditUrl)}`);
  }

  if (data.featured) lines.push(`featured: true`);
  if (data.draft) lines.push(`draft: true`);

  return `---\n${lines.join("\n")}\n---\n`;
};

const listPosts = async () => {
  let entries = [];
  try {
    entries = await readdir(POSTS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findPostFile(entry.name);
    if (!found) continue;

    const raw = await readFile(found.file, "utf-8");
    const { data } = matter(raw);
    posts.push({
      slug: entry.name,
      title: data.title ?? entry.name,
      category: data.category ?? "",
      date:
        data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ""),
      draft: Boolean(data.draft),
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
};

const readPost = async (slug) => {
  if (!isValidSlug(slug)) return null;

  const found = await findPostFile(slug);
  if (!found) return null;

  const raw = await readFile(found.file, "utf-8");
  const { data, content } = matter(raw);
  const coverExt = await findCover(slug);
  const toDateInput = (value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : (value ?? "");

  return {
    slug,
    ext: found.ext,
    frontmatter: {
      title: data.title ?? "",
      excerpt: data.excerpt ?? "",
      category: data.category ?? "",
      date: toDateInput(data.date),
      updatedDate: toDateInput(data.updatedDate),
      author: { name: data.author?.name ?? "", role: data.author?.role ?? "" },
      cover: {
        alt: data.cover?.alt ?? "",
        creditName: data.cover?.creditName ?? "",
        creditUrl: data.cover?.creditUrl ?? "",
        ext: coverExt ?? "",
        hasImage: Boolean(coverExt),
      },
      featured: Boolean(data.featured),
      draft: Boolean(data.draft),
    },
    body: content.trim(),
  };
};

const savePost = async ({ slug, isNew, ext, frontmatter, body }) => {
  if (!isValidSlug(slug)) {
    const error = new Error("Slug must be lowercase letters, numbers, and hyphens only.");
    error.status = 400;
    throw error;
  }

  const dir = path.join(POSTS_DIR, slug);
  const existing = await findPostFile(slug);

  if (isNew && existing) {
    const error = new Error(`A post with slug "${slug}" already exists.`);
    error.status = 409;
    throw error;
  }
  if (!isNew && !existing) {
    const error = new Error(`No post found with slug "${slug}".`);
    error.status = 404;
    throw error;
  }

  await mkdir(dir, { recursive: true });
  const targetExt = existing?.ext ?? ext ?? "md";
  const file = path.join(dir, `index.${targetExt}`);
  const contents = `${toFrontmatter(frontmatter)}\n${body.trim()}\n`;
  await writeFile(file, contents, "utf-8");

  return { slug, file: path.relative(process.cwd(), file) };
};

const deletePost = async (slug) => {
  if (!isValidSlug(slug)) {
    const error = new Error("Invalid slug.");
    error.status = 400;
    throw error;
  }
  const dir = path.join(POSTS_DIR, slug);
  await rm(dir, { recursive: true, force: true });
};


/* ------------------------------------------------------------ categories --- */

/**
 * Categories are a TypeScript const tuple feeding `z.enum()` in the content
 * schema, plus a `Record<Category, string>` of descriptions — so editing them
 * means rewriting source, not data. Rather than parse TS, the two generated
 * blocks are rewritten in place, leaving the file's comments intact.
 */
const CATEGORY_LIST_RE = /(export const categories = \[)([\s\S]*?)(\] as const;)/;
const CATEGORY_DESC_RE =
  /(export const categoryDescriptions: Record<Category, string> = \{)([\s\S]*?)(\n\};)/;

/** Matches a double-quoted JS string, honouring backslash escapes. */
const QUOTED = '"((?:[^"\\\\]|\\\\.)*)"';

/** How many posts reference each category, so in-use ones can't be removed. */
const categoryUsage = async () => {
  const counts = new Map();
  for (const post of await listPosts()) {
    if (!post.category) continue;
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return counts;
};

/** Parses the two generated blocks back into `[{ name, description, count }]`. */
const readCategories = async () => {
  const source = await readFile(CATEGORIES_FILE, "utf-8");

  const listMatch = source.match(CATEGORY_LIST_RE);
  if (!listMatch) throw new Error("Couldn't find the categories list in categories.ts.");

  const names = [...listMatch[2].matchAll(new RegExp(QUOTED, "g"))].map((match) => match[1]);

  const descriptions = new Map();
  const descMatch = source.match(CATEGORY_DESC_RE);
  if (descMatch) {
    // Keys are only quoted when they aren't valid identifiers ("Design Systems").
    const entryRe = new RegExp(`(?:${QUOTED}|([A-Za-z_$][\\w$]*))\\s*:\\s*${QUOTED}`, "g");
    for (const entry of descMatch[2].matchAll(entryRe)) {
      descriptions.set(entry[1] ?? entry[2], entry[3]);
    }
  }

  const counts = await categoryUsage();

  return names.map((name) => ({
    name,
    description: descriptions.get(name) ?? "",
    count: counts.get(name) ?? 0,
  }));
};

const writeCategories = async (entries) => {
  const source = await readFile(CATEGORIES_FILE, "utf-8");

  const list = entries.map((entry) => `  ${quote(entry.name)},`).join("\n");
  // Prettier leaves identifier-safe keys unquoted, so match that to keep diffs
  // to categories.ts limited to the lines that actually changed.
  const descriptions = entries
    .map((entry) => {
      const key = /^[A-Za-z_$][\w$]*$/.test(entry.name) ? entry.name : quote(entry.name);
      return `  ${key}: ${quote(entry.description)},`;
    })
    .join("\n");

  const next = source
    .replace(CATEGORY_LIST_RE, (_, open, __, close) => `${open}\n${list}\n${close}`)
    .replace(CATEGORY_DESC_RE, (_, open, __, close) => `${open}\n${descriptions}${close}`);

  await writeFile(CATEGORIES_FILE, next, "utf-8");
};

const fail = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

/**
 * A rename has to follow through to every post still naming the old value, or
 * those posts fail the schema's `z.enum()` check on the next build.
 */
const renameCategoryInPosts = async (from, to) => {
  let changed = 0;

  for (const post of await listPosts()) {
    if (post.category !== from) continue;

    const found = await findPostFile(post.slug);
    if (!found) continue;

    const raw = await readFile(found.file, "utf-8");
    const updated = raw.replace(/^category:.*$/m, `category: ${quote(to)}`);
    if (updated === raw) continue;

    await writeFile(found.file, updated, "utf-8");
    changed += 1;
  }

  return changed;
};

const saveCategory = async ({ name, description, previousName }) => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) fail("Category name is required.", 400);
  // The name becomes a URL via categorySlug(); a name that slugifies to nothing
  // would produce a broken /category/ route.
  if (!/[a-z0-9]/i.test(trimmed)) fail("Category name needs a letter or number.", 400);

  const entries = await readCategories();
  const targetIndex = previousName
    ? entries.findIndex((entry) => entry.name === previousName)
    : -1;
  const clashIndex = entries.findIndex((entry) => entry.name === trimmed);

  if (previousName && targetIndex === -1) fail(`No category named "${previousName}".`, 404);
  if (clashIndex !== -1 && clashIndex !== targetIndex) fail(`"${trimmed}" already exists.`, 409);

  const next = { name: trimmed, description: String(description ?? "").trim() };
  if (targetIndex === -1) {
    entries.push(next);
  } else {
    entries[targetIndex] = next;
  }

  await writeCategories(entries);

  const renamed =
    previousName && previousName !== trimmed
      ? await renameCategoryInPosts(previousName, trimmed)
      : 0;

  return { name: trimmed, renamed };
};

const deleteCategory = async (name) => {
  const entries = await readCategories();
  const target = entries.find((entry) => entry.name === name);

  if (!target) fail(`No category named "${name}".`, 404);
  if (target.count > 0) {
    const posts = `${target.count} post${target.count === 1 ? "" : "s"}`;
    fail(`"${name}" is used by ${posts}. Move those posts to another category first.`, 409);
  }
  if (entries.length === 1) fail("At least one category has to remain.", 409);

  await writeCategories(entries.filter((entry) => entry.name !== name));
};

/* ---------------------------------------------------------------- images --- */

/** Extensions Astro's image pipeline can process, mapped from the MIME type. */
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/** Reads a request body as a Buffer, refusing anything over the size cap. */
const readBinaryBody = (req, limit = MAX_IMAGE_BYTES) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("Image is larger than 12 MB."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

/**
 * Turns a user-supplied filename into a safe, collision-free basename inside
 * the post folder. The name reaches the markdown as a relative path, so it has
 * to stay free of separators and characters that would need escaping.
 */
const imageFileName = async (dir, original, ext) => {
  const base =
    path
      .basename(original ?? "", path.extname(original ?? ""))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";

  for (let i = 0; i < 100; i++) {
    const name = i === 0 ? `${base}.${ext}` : `${base}-${i}.${ext}`;
    try {
      await stat(path.join(dir, name));
    } catch {
      return name; // does not exist yet
    }
  }
  return `${base}-${Date.now()}.${ext}`;
};

/**
 * Stores an uploaded image beside the post that references it, so Astro's
 * relative-path image pipeline picks it up and optimises it at build time.
 * `cover` is written as cover.<ext> because the frontmatter points at it by a
 * fixed name.
 */
const saveImage = async ({ slug, kind, fileName, contentType, body }) => {
  if (!isValidSlug(slug)) fail("Invalid slug.", 400);

  const ext = IMAGE_TYPES.get(contentType);
  if (!ext) fail("Unsupported image type. Use JPEG, PNG, WebP, AVIF, or GIF.", 415);
  if (!body?.length) fail("Empty upload.", 400);

  const dir = path.join(POSTS_DIR, slug);
  await mkdir(dir, { recursive: true });

  if (kind === "cover") {
    // Only one cover can exist; drop the other extensions so a jpg->png swap
    // cannot leave two candidates behind.
    for (const candidate of IMAGE_TYPES.values()) {
      if (candidate !== ext) await rm(path.join(dir, `cover.${candidate}`), { force: true });
    }
    const name = `cover.${ext}`;
    await writeFile(path.join(dir, name), body);
    return { name, path: `./${name}` };
  }

  const name = await imageFileName(dir, fileName, ext);
  await writeFile(path.join(dir, name), body);
  return { name, path: `./${name}` };
};

/** Removes a post's cover, whichever extension it was stored under. */
const deleteCover = async (slug) => {
  if (!isValidSlug(slug)) fail("Invalid slug.", 400);
  const dir = path.join(POSTS_DIR, slug);
  for (const ext of IMAGE_TYPES.values()) {
    await rm(path.join(dir, `cover.${ext}`), { force: true });
  }
};

/** The cover's on-disk extension, or null when the post has no cover file. */
const findCover = async (slug) => {
  if (!isValidSlug(slug)) return null;
  for (const ext of IMAGE_TYPES.values()) {
    try {
      await stat(path.join(POSTS_DIR, slug, `cover.${ext}`));
      return ext;
    } catch {
      // try next extension
    }
  }
  return null;
};


export function adminApiPlugin() {
  return {
    name: "admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isPostApi = req.url?.startsWith(API_PREFIX);
        const isCategoryApi = req.url?.startsWith(CATEGORY_API_PREFIX);
        const isImageApi = req.url?.startsWith(IMAGE_API_PREFIX);
        if (!isPostApi && !isCategoryApi && !isImageApi) return next();

        const url = new URL(req.url, "http://localhost");
        const prefix = isImageApi
          ? IMAGE_API_PREFIX
          : isCategoryApi
            ? CATEGORY_API_PREFIX
            : API_PREFIX;
        const rest = url.pathname.slice(prefix.length).replace(/^\//, "");

        try {
          if (isImageApi) {
            // Binary upload: the image rides in the body and its metadata in
            // query params, which avoids pulling in a multipart parser.
            if (req.method === "POST") {
              const slug = url.searchParams.get("slug");
              const kind = url.searchParams.get("kind") === "cover" ? "cover" : "inline";
              const fileName = url.searchParams.get("name") ?? "";
              const body = await readBinaryBody(req);
              const result = await saveImage({
                slug,
                kind,
                fileName,
                contentType: (req.headers["content-type"] ?? "").split(";")[0].trim(),
                body,
              });
              return sendJson(res, 200, result);
            }

            if (req.method === "DELETE" && rest) {
              await deleteCover(decodeURIComponent(rest));
              return sendJson(res, 200, { ok: true });
            }

            return sendJson(res, 404, { message: "Unknown image API route." });
          }

          if (isCategoryApi) {
            if (req.method === "GET" && rest === "") {
              return sendJson(res, 200, await readCategories());
            }

            if (req.method === "POST" && rest === "") {
              const body = await readJsonBody(req);
              return sendJson(res, 200, await saveCategory(body));
            }

            if (req.method === "DELETE" && rest) {
              await deleteCategory(decodeURIComponent(rest));
              return sendJson(res, 200, { ok: true });
            }

            return sendJson(res, 404, { message: "Unknown category API route." });
          }

          if (req.method === "GET" && rest === "") {
            return sendJson(res, 200, await listPosts());
          }

          if (req.method === "GET" && rest) {
            const post = await readPost(decodeURIComponent(rest));
            if (!post) return sendJson(res, 404, { message: "Post not found." });
            return sendJson(res, 200, post);
          }

          if (req.method === "POST" && rest === "") {
            const body = await readJsonBody(req);
            const result = await savePost(body);
            return sendJson(res, 200, result);
          }

          if (req.method === "DELETE" && rest) {
            await deletePost(decodeURIComponent(rest));
            return sendJson(res, 200, { ok: true });
          }

          return sendJson(res, 404, { message: "Unknown admin API route." });
        } catch (error) {
          return sendJson(res, error.status ?? 500, {
            message: error.message ?? "Unexpected error.",
          });
        }
      });
    },
  };
}

/**
 * Astro integration that keeps src/pages/admin.astro out of production builds.
 *
 * The editor only works against adminApiPlugin's dev-server middleware, which
 * cannot run on GitHub Pages' static hosting. Without this, `astro build` emits
 * dist/admin/index.html — a publicly reachable page whose every request fails,
 * advertising the authoring surface to anyone who visits. Astro has no public
 * "drop a route" hook, so the route is filtered out of the build's route
 * manifest in `astro:build:setup`. `astro dev` is untouched.
 */
export function adminDevOnlyIntegration() {
  return {
    name: "admin-dev-only",
    hooks: {
      "astro:build:setup": ({ pages }) => {
        // Keys look like "/admin&src/pages/admin.astro".
        for (const key of pages.keys()) {
          if (key.split("&")[1] === ADMIN_PAGE) pages.delete(key);
        }
      },
      // Dropping the page leaves its client script behind: Vite bundles assets
      // before the page filter above runs. Nothing references the orphan, but
      // it still lands in dist carrying the editor's API paths — delete it.
      "astro:build:done": async ({ dir }) => {
        const assetsDir = new URL("_astro/", dir);
        let files = [];
        try {
          files = await readdir(assetsDir);
        } catch {
          return;
        }
        await Promise.all(
          files
            .filter((file) => file.startsWith("admin.astro_astro_type_script"))
            .map((file) => rm(new URL(file, assetsDir), { force: true })),
        );
      },
    },
  };
}
