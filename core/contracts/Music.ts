export type MusicProviderKind = "spotify" | "appleMusic" | "local";
export interface MusicArtist { id?: string; name: string; imageUrl?: string; }
export interface MusicTrack { id: string; title: string; artists: string[]; artistProfiles?: MusicArtist[]; album?: string; artworkUrl?: string; durationMs?: number; provider: MusicProviderKind; externalUrl?: string; }
export interface MusicCapabilities { canPlay: boolean; canPause: boolean; canSkipNext: boolean; canSkipPrevious: boolean; canSeek: boolean; canSetVolume: boolean; canReadQueue: boolean; }
export interface PlaybackState { track?: MusicTrack; playing: boolean; positionMs: number; durationMs?: number; volume?: number; deviceName?: string; updatedAt: string; }
export interface MusicSnapshot { provider?: MusicProviderKind; connected: boolean; capabilities: MusicCapabilities; playback: PlaybackState; queue?: MusicTrack[]; error?: string; }
export interface MusicProvider { kind: MusicProviderKind; getSnapshot(): Promise<MusicSnapshot>; play?(): Promise<void>; pause?(): Promise<void>; next?(): Promise<void>; previous?(): Promise<void>; seek?(positionMs: number): Promise<void>; setVolume?(volume: number): Promise<void>; }
