import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { QuoteCategory, QuoteDto } from "../../db/types";

export function useQuotes(category?: QuoteCategory | "all") {
  return useLiveQuery(async () => {
    const all = await db.quotes.orderBy("createdAt").reverse().toArray();
    if (!category || category === "all") return all;
    return all.filter((q) => q.category === category);
  }, [category]) ?? [];
}

export async function addQuote(text: string, author: string | undefined, category: QuoteCategory) {
  return db.quotes.add({ text: text.trim(), author: author?.trim() || undefined, category, isFavorite: 0, createdAt: Date.now() });
}

export async function updateQuote(id: number, patch: Partial<Pick<QuoteDto, "text" | "author" | "category">>) {
  const clean: Partial<QuoteDto> = {};
  if (patch.text !== undefined) clean.text = patch.text.trim();
  if (patch.author !== undefined) clean.author = patch.author.trim() || undefined;
  if (patch.category !== undefined) clean.category = patch.category;
  await db.quotes.update(id, clean);
}

export async function deleteQuote(id: number) {
  await db.quotes.delete(id);
}

export async function toggleFavorite(q: QuoteDto) {
  if (q.id) await db.quotes.update(q.id, { isFavorite: q.isFavorite ? 0 : 1 });
}

export function pickRandomIndex(len: number, exclude?: number): number {
  if (len <= 1) return 0;
  let i = Math.floor(Math.random() * len);
  if (exclude !== undefined && i === exclude) i = (i + 1) % len;
  return i;
}
