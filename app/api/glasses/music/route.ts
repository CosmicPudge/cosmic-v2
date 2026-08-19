import { NextResponse } from "next/server";

import {
  snapshot,
} from "@/services/music/spotify";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "http://localhost:5173",
  "Access-Control-Allow-Methods":
    "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type",
};

export async function GET() {
  try {
    const music = await snapshot();

    const playback =
      music.playback;

    const track =
      playback?.track;

    if (!music.connected) {
      return NextResponse.json(
        {
          connected: false,
          playback: null,
        },
        {
          headers: corsHeaders,
        },
      );
    }

    if (!track) {
      return NextResponse.json(
        {
          connected: true,
          playback: {
            playing: false,
            track: null,
          },
        },
        {
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        connected: true,

        playback: {
          playing:
            playback.playing,

          positionMs:
            playback.positionMs,

          durationMs:
            playback.durationMs ?? null,

          deviceName:
            playback.deviceName ?? null,

          track: {
            title:
              track.title,

            artists:
              track.artists,

            album:
              track.album ?? null,
          },
        },
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Music Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Cosmic Glasses music.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}