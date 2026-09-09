import { useMediaStore } from '../../state/mediaStore';
import type { Question } from '../../types/quiz';

/** Resolves a question's media to a playable URL: prefers the referenced MediaAsset, falls back to the legacy direct mediaUrl. */
export function useResolvedMediaUrl(question: Question): string | undefined {
  const asset = useMediaStore((s) => (question.mediaId ? s.assets.find((a) => a.id === question.mediaId) : undefined));
  if (question.mediaId) return asset?.status === 'ready' ? asset.url : undefined;
  return question.mediaUrl;
}
