export type SchoolTranscriptSourceType = "apple_voice_memos_transcript" | "manual_transcript" | "other_transcript";

export function isPretranscribedSchoolSourceType(sourceType: string): sourceType is SchoolTranscriptSourceType {
  return sourceType === "apple_voice_memos_transcript" || sourceType === "manual_transcript" || sourceType === "other_transcript";
}
