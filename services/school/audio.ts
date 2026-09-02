export const MAX_SCHOOL_AUDIO_BYTES = 50 * 1024 * 1024;
export const SCHOOL_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/webm", "audio/aac", "audio/ogg", "audio/mpga"] as const;
export type SchoolAudioMimeType = typeof SCHOOL_AUDIO_TYPES[number];

const extensions = new Map([[".mp3", "audio/mpeg"], [".m4a", "audio/mp4"], [".wav", "audio/wav"], [".webm", "audio/webm"], [".aac", "audio/aac"], [".ogg", "audio/ogg"]]);
export function validateSchoolAudio(file: { type: string; name: string; size: number }, bytes?: Uint8Array): SchoolAudioMimeType {
  if (file.size > MAX_SCHOOL_AUDIO_BYTES) throw new Error("Recording exceeds the 50 MB size limit.");
  const extensionType = extensions.get(file.name.toLowerCase().slice(file.name.lastIndexOf(".")));
  const mime = (SCHOOL_AUDIO_TYPES as readonly string[]).includes(file.type) ? file.type : extensionType;
  if (!mime) throw new Error("Unsupported recording. Use MP3, M4A, WAV, WEBM, AAC, or OGG.");
  if (bytes && !looksLikeAudio(bytes, mime)) throw new Error("The recording could not be validated as an audio file.");
  return mime as SchoolAudioMimeType;
}
function looksLikeAudio(bytes: Uint8Array, mime: string) {
  const text = (start: number, length: number) => new TextDecoder().decode(bytes.slice(start, start + length));
  if (mime === "audio/wav" || mime === "audio/x-wav") return text(0, 4) === "RIFF" && text(8, 4) === "WAVE";
  if (mime === "audio/ogg") return text(0, 4) === "OggS";
  if (mime === "audio/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (mime === "audio/mp4") return text(4, 4) === "ftyp";
  if (mime === "audio/aac") return bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  return text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

export type TranscriptSegment = { start: number; end: number; text: string };
export type TranscriptionResult = { transcript: string; segments?: TranscriptSegment[]; provider: string; model: string };
export class SchoolTranscriptionError extends Error { readonly reason: string; constructor(reason: string) { super(reason); this.reason = reason; } }

export async function transcribeSchoolAudio(input: { bytes: Uint8Array; mimeType: SchoolAudioMimeType; fileName: string }): Promise<TranscriptionResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new SchoolTranscriptionError("transcription_provider_not_configured");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(input.bytes).buffer as ArrayBuffer], { type: input.mimeType }), input.fileName);
  form.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe");
  form.append("response_format", "verbose_json");
  let response: Response;
  try { response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(60_000) }); } catch { throw new SchoolTranscriptionError("transcription_timeout"); }
  if (!response.ok) { const status = response.status; throw new SchoolTranscriptionError(status === 401 ? "transcription_unauthorized" : status === 403 ? "transcription_forbidden" : status === 429 ? "transcription_quota_or_rate_limit" : status >= 500 ? "transcription_provider_error" : "transcription_failed"); }
  const data = await response.json() as { text?: unknown; segments?: Array<{ start?: unknown; end?: unknown; text?: unknown }> };
  if (typeof data.text !== "string" || !data.text.trim()) throw new SchoolTranscriptionError("transcription_malformed_response");
  return { transcript: data.text.trim(), segments: Array.isArray(data.segments) ? data.segments.flatMap((s) => typeof s.start === "number" && typeof s.end === "number" && typeof s.text === "string" ? [{ start: s.start, end: s.end, text: s.text }] : []) : undefined, provider: "openai", model: process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe" };
}
