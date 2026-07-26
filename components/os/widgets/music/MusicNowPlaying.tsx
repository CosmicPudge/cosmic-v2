export default function MusicNowPlaying() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        NOW PLAYING
      </p>

      <h2 className="mt-2 text-xl font-semibold text-white">
        No Music Playing
      </h2>

      <p className="mt-2 text-sm text-white/60">
        Connect Spotify or Apple Music to begin listening.
      </p>
    </div>
  );
}