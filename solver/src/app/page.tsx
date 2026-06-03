import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import type { CrosswordMeta } from "../../../shared/types";

export default async function Home() {
  const manifestPath = path.join(process.cwd(), "public", "crosswords", "crosswords.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  const crosswords: CrosswordMeta[] = JSON.parse(raw);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Crosswords</h1>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        {crosswords.length === 0 ? (
          <p className="text-zinc-500 text-sm">No puzzles published yet.</p>
        ) : (
          <ul className="space-y-3">
            {crosswords.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/solve/${c.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200 hover:border-zinc-400 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="font-medium text-zinc-900">{c.title}</div>
                    <div className="text-sm text-zinc-500 mt-0.5">By {c.author}</div>
                  </div>
                  <div className="text-sm text-zinc-400">{c.publishedAt}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
