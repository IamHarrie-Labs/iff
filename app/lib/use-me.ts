import { useQuery } from "@tanstack/react-query";

export type Me =
  | { signedIn: false }
  | {
      signedIn: true;
      email: string | null;
      name: string | null;
      passkey: boolean;
      guest: boolean;
      admin: boolean;
      expiresAt: string | null;
      dailyMessages: number | null;
    };

// Who is signed in, as Iff's interface needs it (guest, admin, expiry).
export function useMe() {
  return useQuery<Me>({
    queryKey: ["iff-me"],
    queryFn: async () => {
      const r = await fetch("/api/iff/me", { credentials: "same-origin" });
      if (!r.ok) return { signedIn: false };
      return (await r.json()) as Me;
    },
    staleTime: 60_000,
  });
}
