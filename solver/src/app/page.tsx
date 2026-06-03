import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import type { CrosswordMeta, Crossword } from "../../../shared/types";

function computeDifficulty(crossword: Crossword): "Easy" | "Medium" | "Hard" {
  const allClues = [...crossword.clues.across, ...crossword.clues.down];
  const avg = allClues.reduce((sum, c) => sum + c.length, 0) / allClues.length;
  if (avg < 7) return "Easy";
  if (avg <= 9) return "Medium";
  return "Hard";
}

const difficultyStyle = {
  Easy: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-red-50 text-red-700 border-red-200",
};

export default async function Home() {
  const manifestPath = path.join(process.cwd(), "public", "crosswords", "crosswords.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  const crosswords: CrosswordMeta[] = JSON.parse(raw);

  const puzzles = await Promise.all(
    crosswords.map(async (c) => {
      try {
        const filePath = path.join(process.cwd(), "public", "crosswords", `${c.id}.json`);
        const data: Crossword = JSON.parse(await fs.readFile(filePath, "utf-8"));
        return { meta: c, difficulty: computeDifficulty(data) };
      } catch {
        return { meta: c, difficulty: null };
      }
    })
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Crosswords</h1>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        {puzzles.length === 0 ? (
          <p className="text-zinc-500 text-sm">No puzzles published yet.</p>
        ) : (
          <ul className="space-y-3">
            {puzzles.map(({ meta: c, difficulty }) => (
              <li key={c.id}>
                <Link
                  href={`/solve/${c.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-zinc-200 hover:border-zinc-400 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="font-medium text-zinc-900">{c.title}</div>
                    <div className="text-sm text-zinc-500 mt-0.5">By {c.author}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {difficulty && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[difficulty]}`}
                      >
                        {difficulty}
                      </span>
                    )}
                    <span className="text-sm text-zinc-400">{c.publishedAt}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
