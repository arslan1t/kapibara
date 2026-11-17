import type { Metadata } from "next";
import { isGenerationEnabled } from "@/lib/generation";
import PreviewClient from "./PreviewClient";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams & { projectId: string }>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return {
    title: t.misc.previewMetaTitle,
    robots: { index: false, follow: false },
  };
}

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
