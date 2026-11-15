import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadReadme } from "@/lib/runebook-readme";
import { runeNameToUrl } from "@/lib/runebook-urls";

export async function PackageReadme({
  name,
  version,
}: {
  name: string;
  version: {
    version: string;
    manifestHash: Buffer;
    readmeBlobHash?: Buffer | null;
  };
}) {
  const readme = await loadReadme(version);
  if (!readme) return null;
  const files = `/runebook/r/${runeNameToUrl(name)}/v/${version.version}/files`;

  return (
    <article className="min-w-0 py-10">
      <h2 className="registry-section-title">Documentation</h2>
      <div className="package-readme">
        <Markdown
          skipHtml
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h3>{children}</h3>,
            h2: ({ children }) => <h3>{children}</h3>,
            h3: ({ children }) => <h4>{children}</h4>,
            h4: ({ children }) => <h5>{children}</h5>,
            h5: ({ children }) => <h6>{children}</h6>,
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            ),
            a: ({ href, children }) => {
              const file = href?.startsWith("./") ? href.slice(2) : href;
              const target =
                file && !/^(?:[a-z][a-z0-9+.-]*:|[/#?])/i.test(file)
                  ? `${files}?path=${encodeURIComponent(file)}`
                  : href;
              return <a href={target || undefined}>{children}</a>;
            },
          }}
        >
          {readme.markdown}
        </Markdown>
      </div>
      {readme.truncated && (
        <Link href={files} className="site-text-link mt-4 inline-block">
          Browse files for the full README
        </Link>
      )}
    </article>
  );
}
