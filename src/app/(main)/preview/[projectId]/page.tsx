import type { Metadata } from "next";
import { isGenerationEnabled } from "@/lib/generation";
import PreviewClient from "./PreviewClient";

export const metadata: Metadata = {
  title: "Превью книги",
  robots: { index: false, follow: false },
};

// Whether generation is offered depends on configured credentials.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <PreviewClient projectId={projectId} generationEnabled={isGenerationEnabled()} />
  );
}
