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
export type SchoolTranscriptResult = { text: string; segments?: TranscriptSegment[]; language?: string; durationSeconds?: number; provider: string; model: string };
export type TranscriptionResult = SchoolTranscriptResult;
export type SchoolTranscriptionFailureCode = "transcription_quota" | "transcription_rate_limit" | "transcription_timeout" | "transcription_provider_unavailable" | "transcription_invalid_audio" | "transcription_unsupported_audio" | "transcription_too_large" | "transcription_auth_configuration" | "transcription_unknown";
export class SchoolTranscriptionError extends Error { readonly code: SchoolTranscriptionFailureCode; readonly retryable: boolean; readonly status?: number; constructor(code: SchoolTranscriptionFailureCode, options?: { retryable?: boolean; status?: number }) { super(code); this.name = "SchoolTranscriptionError"; this.code = code; this.retryable = options?.retryable ?? ["transcription_quota", "transcription_rate_limit", "transcription_timeout", "transcription_provider_unavailable"].includes(code); this.status = options?.status; } }
