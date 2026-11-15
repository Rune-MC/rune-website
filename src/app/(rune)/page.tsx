import { ArrowDownToLine, ArrowRight, BookOpen, Boxes } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LanguageMatrix } from "@/components/landing/language-matrix";

const paths = [
  {
    icon: ArrowDownToLine,
    title: "Install Rune",
    body: "Add Rune to an existing Paper server on Windows, Linux, or macOS.",
    href: "/install",
  },
  {
    icon: BookOpen,
    title: "Write your first script",
    body: "Choose a language and load your first event handler in Paper.",
    href: "/docs",
  },
  {
    icon: Boxes,
    title: "Browse Runebook",
    body: "Find scripts and libraries, review their source, and install a pinned version.",
    href: "/runebook",
  },
];

export default function HomePage() {
  return (
    <div className="site-shell home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content">
          <p className="home-kicker">
            <Image src="/icon.png" alt="" width={27} height={27} />
            For Paper Minecraft servers
          </p>
          <h1 id="home-title">
            Build for Paper.
            <br />
            Pick a language.
          </h1>
          <p className="home-intro">
            Write server scripts in Python, TypeScript, or JavaScript. Handle
            events, add commands, and reload from the server console.
          </p>
          <Link href="/install" className="site-button site-button-primary">
            Install Rune <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <LanguageMatrix />
      </section>

      <section className="home-paths" aria-labelledby="paths-title">
        <div>
          <h2 id="paths-title">Where to start</h2>
          <p>
            Set up a server, build a script, or find a package that already does
            what you need.
          </p>
        </div>
        <ul>
          {paths.map(({ icon: Icon, title, body, href }) => (
            <li key={href}>
              <Link href={href}>
                <span className="path-icon">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </span>
                <ArrowRight
                  className="path-arrow"
                  size={19}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-languages" aria-labelledby="languages-title">
        <div className="home-languages-heading">
          <h2 id="languages-title">Choose a runtime</h2>
          <Link href="/docs/runtimes" className="site-text-link">
            Compare runtimes <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="home-runtime-grid">
          <article>
            <span className="runtime-file">index.py</span>
            <h3>Python</h3>
            <p>
              Handle snapshots of Paper events with Python decorators. Register
              commands, broadcast messages, and use async handlers in a CPython
              worker.
            </p>
            <Link href="/docs/quickstart/python" className="site-text-link">
              Start with Python <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
          <article>
            <span className="runtime-file">index.ts / index.js</span>
            <h3>TypeScript and JavaScript</h3>
            <p>
              Work with live Paper objects from embedded Node.js. Use Adventure
              messaging, classpath-generated types, and typed services between
              Runes.
            </p>
            <Link
              href="/docs/quickstart#node-runtime"
              className="site-text-link"
            >
              Start with Node.js <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
