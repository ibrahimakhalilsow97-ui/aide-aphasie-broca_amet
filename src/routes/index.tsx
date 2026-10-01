import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parole+ — Entraînement progressif au langage" },
      {
        name: "description",
        content:
          "Parole+ propose une séance douce d'exercices de langage : reconnaître, nommer, répéter, construire des phrases et communiquer au quotidien.",
      },
      { property: "og:title", content: "Parole+ — Entraînement progressif au langage" },
      {
        property: "og:description",
        content:
          "Une séance simple et rassurante pour pratiquer les mots et les phrases, pas à pas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/parole-plus/index.html"
      title="Parole+"
      allow="microphone"
      className="block h-dvh min-h-screen w-full max-w-full border-0"
    />
  );
}
