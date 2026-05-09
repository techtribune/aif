import type { Metadata } from "next";

import DisplayExperience from "@/app/display/DisplayExperience";

export const metadata: Metadata = {
  title: "Asian Innovation Forum",
  description:
    "Public showcase for the Asian Innovation Forum—about the program, photo moments from past gatherings, presented by Daily Tribune.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <DisplayExperience />;
}
