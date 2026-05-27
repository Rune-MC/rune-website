import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileTree } from "@/components/runebook/file-tree";
import { FileViewer } from "@/components/runebook/file-viewer";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Rune } from "@/lib/db/models/rune";
import { RuneVersion } from "@/lib/db/models/rune-version";
import { formatBytes } from "@/lib/file-language";
import { buildTree, findFile, type TreeDir } from "@/lib/file-tree";
import { type FileEntry, fileEntrySchema, hashHex } from "@/lib/manifest";
import { fetchManifestJson } from "@/lib/r2/fetch";
import { runeNameToUrl, urlToRuneName } from "@/lib/runebook-urls";

interface Params {
  name: string;
  version: string;
}

export const dynamic = "force-dynamic";

interface Loaded {
  baseHref: string;
  entryPath: string;
  files: FileEntry[];
  tree: TreeDir;
  totalBytes: number;
}

async function loadFiles(
  rawName: string,
  version: string,
): Promise<Loaded | null> {
  if (!isDbConfigured()) return null;
  await connectDb();
  const name = urlToRuneName(rawName).toLowerCase();
  const rune = await Rune.findOne({ name }).lean();
  if (!rune) return null;
  const ver = await RuneVersion.findOne({
    runeId: rune._id,
    version,
  }).lean();
  if (!ver || ver.status === "pending") return null;

  const manifest = await fetchManifestJson(hashHex(ver.manifestHash));
  const filesRaw = Array.isArray(manifest.files) ? manifest.files : [];
  const files: FileEntry[] = [];
  for (const f of filesRaw) {
    const parsed = fileEntrySchema.safeParse(f);
    if (parsed.success) files.push(parsed.data);
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const entryPath = typeof manifest.entry === "string" ? manifest.entry : "";
  const tree = buildTree(files);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const baseHref = `/runebook/r/${runeNameToUrl(rune.name)}/v/${version}/files`;
  return { baseHref, entryPath, files, tree, totalBytes };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { name, version } = await params;
  const decoded = urlToRuneName(name);
  return {
    title: `${decoded} v${version} · files`,
    description: `Browse and inspect every file in ${decoded} v${version}.`,
  };
}

export default async function VersionFilesPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ path?: string | string[] }>;
}) {
  const [{ name, version }, sp] = await Promise.all([params, searchParams]);
  const loaded = await loadFiles(name, version);
  if (!loaded) notFound();

  const { baseHref, entryPath, files, tree, totalBytes } = loaded;

  const rawPath = Array.isArray(sp.path) ? sp.path[0] : sp.path;
  const requestedPath = rawPath?.trim() ?? null;
  const selected = requestedPath
    ? findFile(tree, requestedPath)
    : entryPath
      ? findFile(tree, entryPath)
      : files[0]
        ? findFile(tree, files[0].path)
        : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <h2 className="font-mono text-xs text-muted-foreground">files</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
          {formatBytes(totalBytes)}
        </span>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Manifest did not list any files.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
            <FileTree
              root={tree}
              baseHref={baseHref}
              selectedPath={selected?.path ?? null}
            />
          </aside>
          <div className="min-w-0">
            {selected ? (
              <FileViewer file={selected} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Pick a file from the tree to inspect it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
