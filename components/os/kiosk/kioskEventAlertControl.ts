export interface KioskAlertMusicDecision {
  wasPlayingBeforeAlert: boolean;
  pausedByCosmic: boolean;
  playbackChangedDuringAlert: boolean;
}

export function shouldResumeMusicAfterAlert(decision: KioskAlertMusicDecision) {
  return decision.wasPlayingBeforeAlert && decision.pausedByCosmic && !decision.playbackChangedDuringAlert;
}
