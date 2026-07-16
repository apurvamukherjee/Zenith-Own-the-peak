import { db } from "../db/db";
import type { QuoteCategory } from "../db/types";

// Seed quotes shipped with the app so Home's quote card feels alive from
// first launch. All short attributed aphorisms from public-domain / widely
// known figures — the user can edit or delete any of them from /quotes.
// Idempotent: skipped if any quotes already exist locally.
interface SeedQuote { text: string; author?: string; category: QuoteCategory; }

const SEED: SeedQuote[] = [
  // ---- Gym ----
  { text: "Discipline equals freedom.", author: "Jocko Willink", category: "gym" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", category: "gym" },
  { text: "It's not the will to win that matters — it's the will to prepare to win that matters.", author: "Paul Bryant", category: "gym" },
  { text: "Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.", author: "Ronnie Coleman", category: "gym" },
  { text: "Suffer the pain of discipline or suffer the pain of regret.", category: "gym" },
  { text: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt", category: "gym" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger", category: "gym" },
  // ---- Study ----
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi", category: "study" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes", category: "study" },
  { text: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein", category: "study" },
  { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", category: "study" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie", category: "study" },
  // ---- Life ----
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "life" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "life" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", category: "life" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "life" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "life" },
];

export async function seedQuotesIfEmpty(): Promise<void> {
  const count = await db.quotes.count();
  if (count > 0) return;
  const now = Date.now();
  await db.quotes.bulkAdd(
    SEED.map((q, i) => ({
      text: q.text,
      author: q.author,
      category: q.category,
      isFavorite: 0,
      // Stagger createdAt by 1 ms per row so ordering is stable across
      // reruns without depending on insertion order.
      createdAt: now + i,
    })),
  );
}
