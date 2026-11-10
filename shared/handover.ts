export type GuideEntry = {
  title: string;
  category: string;
  instructions: string;
  essential: boolean;
  lastEvidence?: string;
  openQuestion: string;
};

export function formatHandover(recipient: string, items: GuideEntry[]) {
  return (
    `Iff · Guide for ${recipient}\nOwner preview · no account access granted\n\n` +
    items
      .map((item) =>
        [
          `${item.title}${item.essential ? " · Essential" : ""}`,
          item.instructions,
          `Last evidence: ${item.lastEvidence ?? "Date unknown"}`,
          item.openQuestion ? `Still to clarify: ${item.openQuestion}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n")
  );
}
