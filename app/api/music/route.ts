import { NextResponse } from "next/server";
import { snapshot } from "@/services/music/spotify";
export async function GET() { return NextResponse.json(await snapshot()); }
