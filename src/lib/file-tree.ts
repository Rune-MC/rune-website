import type { FileEntry } from "@/lib/manifest";

export interface TreeFile {
  kind: "file";
  name: string;
  path: string;
  entry: FileEntry;
}

export interface TreeDir {
  kind: "dir";
  name: string;
  path: string;
  children: TreeNode[];
}

export type TreeNode = TreeFile | TreeDir;

/**
 * Build a hierarchical tree from a flat list of file paths. Folders are
 * inferred from path segments. Children are sorted dirs-first, then alphabetically.
 */
export function buildTree(files: FileEntry[]): TreeDir {
  const root: TreeDir = { kind: "dir", name: "", path: "", children: [] };

  for (const entry of files) {
    const parts = entry.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i];
      const path = parts.slice(0, i + 1).join("/");
      let next = current.children.find(
        (c): c is TreeDir => c.kind === "dir" && c.name === name,
      );
      if (!next) {
        next = { kind: "dir", name, path, children: [] };
        current.children.push(next);
      }
      current = next;
    }

    const fileName = parts[parts.length - 1] ?? entry.path;
    current.children.push({
      kind: "file",
      name: fileName,
      path: entry.path,
      entry,
    });
  }

  sortTree(root);
  return root;
}

function sortTree(node: TreeDir) {
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    if (child.kind === "dir") sortTree(child);
  }
}

/** Whether `descendant` is inside `dir` (so the folder should default-open). */
export function isAncestor(dirPath: string, descendantPath: string): boolean {
  if (!dirPath) return true;
  return descendantPath === dirPath || descendantPath.startsWith(`${dirPath}/`);
}

export function findFile(root: TreeDir, path: string): TreeFile | null {
  for (const child of root.children) {
    if (child.kind === "file" && child.path === path) return child;
    if (child.kind === "dir") {
      const found = findFile(child, path);
      if (found) return found;
    }
  }
  return null;
}
