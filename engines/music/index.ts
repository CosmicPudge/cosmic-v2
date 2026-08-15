import type { MusicProvider, MusicSnapshot } from "@/core/contracts/Music";
const disconnected: MusicSnapshot = { connected: false, capabilities: { canPlay:false, canPause:false, canSkipNext:false, canSkipPrevious:false, canSeek:false, canSetVolume:false, canReadQueue:false }, playback: { playing:false, positionMs:0, updatedAt:"" } };
export class MusicEngine { constructor(private readonly provider?: MusicProvider) {} async refresh(): Promise<MusicSnapshot> { return this.provider ? this.provider.getSnapshot() : disconnected; } }
