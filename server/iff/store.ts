import { getRequestUserEmail } from "@agent-native/core/server";
import { eq } from "drizzle-orm";

import { getDb } from "../db";
import { iffWorkspace } from "../db/schema";
import { empty, type State } from "./domain";

// Every workspace row belongs to exactly one signed-in person. The row id is
// derived from the caller's verified session email, never from user input, so
// one person can't read or write another person's records.
export function ownerKey(email = getRequestUserEmail()) {
  const clean = email?.trim().toLowerCase();
  if (!clean) throw new Error("Sign in to open your Iff workspace.");
  return `user:${clean}`;
}

export async function readState(owner = ownerKey()) {
  const db = getDb();
  let rows = await db.select().from(iffWorkspace).where(eq(iffWorkspace.id, owner));
  // Carry over the single workspace that local development used before
  // per-person storage existed.
  if (!rows[0] && process.env.NODE_ENV === "development" && owner === "user:dev@local.test")
    rows = await db.select().from(iffWorkspace).where(eq(iffWorkspace.id, "local"));
  const state = rows[0]?.state ?? empty();
  // Earlier records used the first date in the entire file. Prefer the date in
  // the exact evidence row without changing user-entered instructions.
  for (const item of state.items) {
    for (const evidence of item.evidence) {
      evidence.date = evidence.quote.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? evidence.date;
    }
  }
  return state;
}

// Writes for the same person run one after another so two quick edits can't
// overwrite each other.
const queues = new Map<string, Promise<unknown>>();
export function changeState(fn: (state: State) => State, owner = ownerKey()) {
  const prev = queues.get(owner) ?? Promise.resolve();
  const result = prev.then(async () => {
    const state = fn(await readState(owner));
    await getDb()
      .insert(iffWorkspace)
      .values({ id: owner, state })
      .onConflictDoUpdate({ target: iffWorkspace.id, set: { state } });
    return state;
  });
  const tail = result.catch(() => {});
  queues.set(owner, tail);
  void tail.then(() => {
    if (queues.get(owner) === tail) queues.delete(owner);
  });
  return result;
}

export async function deleteWorkspace(owner: string) {
  await getDb().delete(iffWorkspace).where(eq(iffWorkspace.id, owner));
}
