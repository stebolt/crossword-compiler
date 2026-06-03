import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Crossword } from "../../../../../shared/types";
import { CrosswordSolver } from "@/components/CrosswordSolver";

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const filePath = path.join(process.cwd(), "public", "crosswords", `${id}.json`);

  let crossword: Crossword;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    crossword = JSON.parse(raw);
  } catch {
    notFound();
  }

  return <CrosswordSolver crossword={crossword} />;
}
