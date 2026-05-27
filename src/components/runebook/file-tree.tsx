import { ChevronRight, File, FileCode, Folder } from "lucide-react";
import Link from "next/link";
import { detectLanguage } from "@/lib/file-language";
import { isAncestor, type TreeDir, type TreeNode } from "@/lib/file-tree";

interface Props {
  root: TreeDir;
  baseHref: string;
  selectedPath: string | null;
}

export function FileTree({ root, baseHref, selectedPath }: Props) {
  return (
    <nav aria-label="File tree" className="font-mono text-xs">
      <ul className="space-y-px">
        {root.children.map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={0}
            baseHref={baseHref}
            selectedPath={selectedPath}
          />
        ))}
      </ul>
    </nav>
  );
}

function TreeRow({
  node,
  depth,
  baseHref,
  selectedPath,
}: {
  node: TreeNode;
  depth: number;
  baseHref: string;
  selectedPath: string | null;
}) {
  const indent = { paddingLeft: `${depth * 0.875 + 0.25}rem` };

  if (node.kind === "dir") {
    const open = selectedPath ? isAncestor(node.path, selectedPath) : depth < 1;
    return (
      <li>
        <details open={open} className="group">
          <summary
            className="flex cursor-pointer items-center gap-1.5 rounded py-1 pr-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            style={indent}
          >
            <ChevronRight
              aria-hidden="true"
              className="size-3 shrink-0 transition-transform group-open:rotate-90"
            />
            <Folder
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="truncate">{node.name}</span>
          </summary>
          <ul className="space-y-px">
            {node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                baseHref={baseHref}
                selectedPath={selectedPath}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  }

  const isSelected = node.path === selectedPath;
  const lang = detectLanguage(node.path);
  const Icon = lang ? FileCode : File;

  return (
    <li>
      <Link
        href={`${baseHref}?path=${encodeURIComponent(node.path)}`}
        aria-current={isSelected ? "page" : undefined}
        className={
          isSelected
            ? "flex items-center gap-1.5 rounded bg-muted py-1 pr-2 text-foreground"
            : "flex items-center gap-1.5 rounded py-1 pr-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        }
        style={{ paddingLeft: `${depth * 0.875 + 1.125}rem` }}
      >
        <Icon
          aria-hidden="true"
          className={
            isSelected
              ? "size-3.5 shrink-0 text-primary"
              : "size-3.5 shrink-0 text-muted-foreground"
          }
        />
        <span className="truncate">{node.name}</span>
      </Link>
    </li>
  );
}
