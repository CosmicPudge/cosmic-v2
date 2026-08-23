"use client";

import { useEffect, useRef, useState } from "react";
import type { VehicleScanKind, VehicleScanResult } from "@/core/contracts/VehicleScanning";

const input = "mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60";
const button = "rounded-xl bg-cyan-300/20 px-3 py-2 text-sm text-cyan-50 hover:bg-cyan-300/30 focus:outline-none focus:ring-2 focus:ring-cyan-200";

export function VehicleScanReview({ kind, candidate, region, source = "camera", onConfirm, onCancel }: { kind: VehicleScanKind; candidate?: string; region?: string; source?: "camera" | "simulated"; onConfirm: (result: VehicleScanResult) => void; onCancel?: () => void }) {
  const [value, setValue] = useState(candidate ?? "");
  const [selectedRegion, setSelectedRegion] = useState(region ?? "");
  const [message, setMessage] = useState("");
  const normalized = kind === "vin" ? value.replace(/\s+/g, "").toUpperCase() : value.trim().toUpperCase();
  const confirm = () => {
    if (kind === "vin" && !/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) { setMessage("Enter a valid 17-character VIN. OCR can misread letters; review it carefully."); return; }
    if (kind === "plate" && (!normalized || !selectedRegion)) { setMessage("Confirm the plate and select its state before lookup."); return; }
    onConfirm({ kind, value: normalized, region: kind === "plate" ? selectedRegion : undefined, confidence: candidate ? 0.5 : undefined, source });
  };
  return <section className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.05] p-4" aria-labelledby="scan-review-title"><h3 id="scan-review-title" className="font-medium">Review detected {kind === "vin" ? "VIN" : "license plate"}</h3><p className="mt-1 text-sm text-white/55">Nothing is looked up until you confirm this value.</p><label className="mt-3 block text-sm text-white/70">{kind === "vin" ? "Detected VIN" : "License plate"}<input className={input} value={value} onChange={(event) => setValue(event.target.value)} autoCapitalize="characters" autoComplete="off" /></label>{kind === "plate" ? <label className="mt-3 block text-sm text-white/70">State / Region<select className={input} value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}><option value="">Select state</option>{["AL", "AK", "AZ", "AR", "CA", "CO", "FL", "GA", "IL", "MA", "MI", "MN", "MO", "NC", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "TN", "TX", "UT", "VA", "WA", "WI"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label> : null}<p className="mt-2 text-xs text-white/55" aria-live="polite">{message}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={confirm}>Confirm and Look Up</button><button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200" onClick={onCancel}>Scan Again</button></div></section>;
}

export default function VehicleScanner({ kind, onConfirm, onCancel }: { kind: VehicleScanKind; onConfirm: (result: VehicleScanResult) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"off" | "requesting" | "active" | "candidate" | "denied" | "unavailable">("off");
  const [candidate, setCandidate] = useState<string>();
  const [region, setRegion] = useState<string>();
  const [notice, setNotice] = useState("");
  const stop = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; setStatus("off"); };
  useEffect(() => () => stop(), []);
  const start = async () => { if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setStatus("unavailable"); setNotice("Camera scanning requires HTTPS or localhost and a browser with camera support."); return; } setStatus("requesting"); setNotice(""); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); } setStatus("active"); } catch { setStatus("denied"); setNotice("Camera access unavailable. You can type the identifier manually."); } };
  const capture = () => { const video = videoRef.current; if (!video || video.readyState < 2) return; const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d")?.drawImage(video, 0, 0); stop(); setCandidate(""); setRegion(undefined); setStatus("candidate"); setNotice(kind === "vin" ? "The browser camera is ready, but general OCR is not consistently available on the web. Type or correct the VIN from the transient frame." : "Review the plate text and select its state. Browser plate OCR is not assumed."); };
  if (status === "candidate") return <div><p className="mt-3 text-sm text-amber-100" role="status">{notice}</p><VehicleScanReview kind={kind} candidate={candidate} region={region} onConfirm={onConfirm} onCancel={() => { setStatus("off"); setNotice(""); }} /></div>;
  return <section className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.05] p-4" aria-labelledby="camera-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="camera-title" className="font-medium">Scan {kind === "vin" ? "VIN" : "License Plate"}</h3><p className="mt-1 text-sm text-white/55">Camera access starts only after you press Start Camera. Images are transient and are not uploaded.</p></div><span className="text-xs text-white/50">{status === "active" ? "Camera active" : status === "requesting" ? "Requesting permission" : status === "denied" ? "Permission denied" : status === "unavailable" ? "Camera unavailable" : "Camera off"}</span></div>{status === "active" ? <div className="mt-3"><video ref={videoRef} className="aspect-video w-full rounded-xl bg-black object-cover" playsInline muted aria-label={`Camera preview for ${kind} scan`} /><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={capture}>Capture for review</button><button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-sm" onClick={() => { stop(); onCancel(); }}>Stop camera</button></div></div> : <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={start} disabled={status === "requesting"}>{status === "requesting" ? "Requesting…" : "Start Camera"}</button><button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-sm" onClick={onCancel}>Use another method</button></div>}{notice ? <p className="mt-3 text-sm text-amber-100" role="status">{notice}</p> : null}</section>;
}
