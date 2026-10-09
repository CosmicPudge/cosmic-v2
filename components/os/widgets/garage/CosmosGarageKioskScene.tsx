"use client";

import type { ReactNode } from "react";
import { CarFront, FileText, Fuel, Gauge, ListChecks, Settings2, Wrench } from "lucide-react";
import { useClockTick } from "@/hooks/os/useClock";
import useWeather from "@/hooks/os/useWeather";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import { maintenanceStatus, useGarage } from "@/hooks/os/useGarage";
import { TEMPORARY_KIOSK_LOCATION } from "@/services/kioskLocation";

export default function CosmosGarageKioskScene() {
  const now = useClockTick(1_000);
  const garage = useGarage();
  const developer = useDeveloperKioskData();
  const directWeather = useWeather({ enabled: true });
  const weather = developer.data?.weather ?? directWeather.weather;
  const location = developer.data?.location?.label ?? (weather?.city && weather.city !== "Current location" ? weather.city : TEMPORARY_KIOSK_LOCATION.label);
  const kioskGarage = developer.data?.garage;
  const localVehicle = garage.selectedVehicle;
  const vehicle = localVehicle ?? (kioskGarage?.vehicle ? { id: kioskGarage.vehicle.id, nickname: kioskGarage.vehicle.nickname, year: 2003, make: "Honda", model: "Civic", trim: undefined, currentMileage: kioskGarage.vehicle.mileage, status: kioskGarage.vehicle.status } : undefined);
  const summary = garage.summary;
  const telemetry = vehicle ? garage.data.telemetrySnapshots.filter((item) => item.vehicleId === vehicle.id).sort((a,b)=>b.timestamp.localeCompare(a.timestamp))[0] : undefined;
  const connection = vehicle ? garage.data.connections.find((item) => item.vehicleId === vehicle.id && item.status === "connected") : undefined;
  const maintenance = summary?.maintenance.map((item) => ({ item, status: maintenanceStatus(item, summary.currentMileage) })).sort((a,b) => rank(a.status)-rank(b.status)).slice(0,4) ?? [];
  const fuelLevel = telemetry?.fuelLevel ?? kioskGarage?.vehicle?.fuelLevel;
  const range = fuelLevel !== undefined && summary?.averageMpg ? Math.round((fuelLevel / 100) * 13.2 * summary.averageMpg) : undefined;
  const engine = vehicle?.vinSpecifications ? [vehicle.vinSpecifications.displacement, vehicle.vinSpecifications.engineCylinders ? vehicle.vinSpecifications.engineCylinders + " cyl" : undefined].filter(Boolean).join(" · ") : undefined;
  const transmission = localVehicle?.vinSpecifications?.transmission ?? (vehicle ? "Temporary replacement · ~300k mi" : undefined);
  const displayedMileage = summary?.currentMileage ?? kioskGarage?.vehicle?.mileage ?? (vehicle ? 150_000 : undefined);
  const knownService = vehicle ? [{ name: "Timing Belt", status: "upcoming", due: "Recently replaced" }, { name: "Water Pump", status: "upcoming", due: "Recently replaced" }, { name: "Transmission", status: "dueSoon", due: "Temporary · ~300k mi" }] : [];

  return <section data-kiosk-rebuild="garage" className="relative h-full w-full select-none overflow-hidden bg-[#080b10] text-white">
    <div className="absolute inset-0 bg-[url('/dashboard/garage/automotive-workshop.webp')] bg-cover bg-center opacity-90"/>
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,11,.45),rgba(4,8,14,.12)_54%,rgba(4,7,13,.38)),linear-gradient(0deg,rgba(3,5,9,.52),transparent_55%)]"/>
    <div className="relative z-10 flex h-full flex-col px-[2.8vw] py-[3.2vh]">
      <Header now={now} weather={weather} location={location}/>
      <div className="mt-[3.4vh] grid min-h-0 flex-1 grid-cols-[1.05fr_.94fr_.74fr] grid-rows-[.62fr_1.15fr_.83fr] gap-[1.35vw]">
        <Glass className="row-span-2 p-[1.7vw]">
          <div className="flex items-center justify-between"><Label>{vehicle ? vehicle.year + " " + vehicle.make + " " + vehicle.model + (vehicle.trim ? " " + vehicle.trim : "") : "SELECTED VEHICLE"}</Label><span className="flex items-center gap-2 text-[clamp(.55rem,.85vw,.8rem)] tracking-[.25em] text-white/65"><i className={"h-2 w-2 rounded-full " + (connection ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.9)]" : "bg-white/30")}/>{connection ? "ONLINE" : "LOCAL"}</span></div>
          <div className="flex min-h-0 flex-1 items-center justify-center py-[1vh]"><CarFront strokeWidth={.75} className="h-[15vh] w-[19vw] text-white/80 drop-shadow-[0_10px_25px_rgba(0,0,0,.65)]"/></div>
          <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
            <Metric value={displayedMileage !== undefined ? "~" + displayedMileage.toLocaleString() : "—"} label="Miles"/>
            <Metric value={engine || vehicle?.vinSpecifications?.fuelType || "—"} label="Engine"/>
            <Metric value={transmission || "—"} label="Transmission"/>
          </div>
        </Glass>
        <Glass className="col-span-2 p-[1.55vw]">
          <Label>FUEL</Label>
          <div className="mt-[1.5vh] flex items-center gap-[1.5vw]"><Fuel className="h-7 w-7 text-white/85"/><div className="min-w-[7vw]"><p className="text-[clamp(1rem,1.8vw,1.8rem)] font-medium">{range !== undefined ? range + " mi" : "—"}</p><p className="text-xs text-white/45">Range (est.)</p></div><div className="h-10 w-px bg-white/15"/><div className="flex flex-1 items-center gap-3"><span className="text-xs text-white/55">E</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12"><div className="h-full rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,.65)]" style={{width: Math.max(0,Math.min(100,fuelLevel ?? 0)) + "%"}}/></div><span className="w-12 text-right text-sm text-white/65">{fuelLevel !== undefined ? "~" + Math.round(fuelLevel) + "%" : "—"}</span></div></div>
        </Glass>
        <Glass className="col-span-2 p-[1.55vw]">
          <Label>MAINTENANCE</Label>
          <div className="mt-[1vh] divide-y divide-white/10">{maintenance.length ? maintenance.map(({item,status}) => <MaintenanceRow key={item.id} name={item.name} status={status} due={item.nextDueMileage !== undefined && summary ? dueText(item.nextDueMileage-summary.currentMileage) : item.nextDueDate}/>) : knownService.length ? knownService.map((item) => <MaintenanceRow key={item.name} name={item.name} status={item.status} due={item.due}/>) : <div className="flex h-[14vh] items-center justify-center text-sm text-white/45">{garage.loading ? "Loading Garage…" : "No vehicle selected."}</div>}</div>
        </Glass>
        <Glass className="p-[1.45vw]">
          <Label>QUICK ACTIONS</Label>
          <div className="mt-[1.5vh] grid grid-cols-2 gap-[.8vw]"><Action icon={<FileText/>} label="Service Log"/><Action icon={<ListChecks/>} label="Parts List"/><Action icon={<Wrench/>} label="Mod Plans"/><Action icon={<Settings2/>} label="Troubleshooting"/></div>
        </Glass>
        <Glass className="col-span-2 p-[1.45vw]">
          <div className="flex items-center justify-between"><Label>GARAGE STATUS</Label><span className="text-xs text-white/40">{vehicle?.nickname ?? "No vehicle"}</span></div>
          <div className="mt-[1.4vh] grid grid-cols-4 gap-[1vw]">
            <Status icon={<Gauge/>} value={summary?.latestMpg ? summary.latestMpg.toFixed(1) : "—"} label="Latest MPG"/>
            <Status icon={<Wrench/>} value={String(maintenance.length ? maintenance.filter(x=>x.status==="overdue"||x.status==="dueSoon").length : knownService.filter(x=>x.status==="dueSoon").length)} label="Maintenance"/>
            <Status icon={<Settings2/>} value={String(summary?.issues.filter(x=>x.status!=="resolved").length ?? kioskGarage?.openIssues ?? 0)} label="Open Issues"/>
            <Status icon={<FileText/>} value={summary?.services[0]?.date ?? "—"} label="Recent Service"/>
          </div>
        </Glass>
      </div>
    </div>
  </section>;
}

function Header({now,weather,location}:{now:number|null;weather:{temp:number;condition:string}|null;location:string}) {
  const date=now?new Date(now):null;
  return <header className="flex items-start justify-between"><div><div className="text-[clamp(1.7rem,3vw,3.2rem)] font-light tracking-[.28em]">COSMOS</div><div className="mt-1 pl-[6vw] text-[clamp(.7rem,1.1vw,1rem)] tracking-[.48em] text-white/65">GARAGE</div></div><div className="flex items-start gap-[2vw] text-right"><div><p className="text-[clamp(.7rem,1.05vw,1rem)] tracking-[.08em]">{date?new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(date):"Synchronizing"}</p><p className="mt-1 text-[clamp(1.8rem,3.4vw,3.5rem)] font-light tabular-nums">{date?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(date):"--:--"}</p></div><div className="h-[4.8rem] w-px bg-white/20"/><div><p className="text-[clamp(1.4rem,2.2vw,2.2rem)] font-semibold">{weather?Math.round(weather.temp):"--"}°</p><p className="text-sm">{weather?.condition??"Weather unavailable"}</p><p className="mt-1 text-xs text-white/60">{location}</p></div></div></header>;
}
function Glass({children,className=""}:{children:ReactNode;className?:string}){return <div className={"flex min-h-0 flex-col overflow-hidden rounded-[1.45vw] border border-white/20 bg-[linear-gradient(135deg,rgba(18,22,31,.73),rgba(7,11,20,.60))] shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_16px_45px_rgba(0,0,0,.28)] backdrop-blur-2xl " + className}>{children}</div>}
function Label({children}:{children:ReactNode}){return <p className="text-[clamp(.55rem,.82vw,.78rem)] tracking-[.29em] text-white/72">{children}</p>}
function Metric({value,label}:{value:string;label:string}){return <div className="px-2"><p className="truncate text-[clamp(.8rem,1.4vw,1.35rem)] font-medium">{value}</p><p className="mt-1 text-xs text-white/48">{label}</p></div>}
function MaintenanceRow({name,status,due}:{name:string;status:string;due?:string}){const width=status==="overdue"?"24%":status==="dueSoon"?"55%":status==="upcoming"?"82%":"92%";return <div className="grid grid-cols-[1fr_.75fr] items-center gap-3 py-[.65vh]"><div className="min-w-0"><p className="truncate text-sm">{name}</p><p className="truncate text-[11px] text-white/45">{status==="overdue"?"Overdue":status==="dueSoon"?"Check soon":status==="upcoming"?"Good":"Not scheduled"}{due?" · "+due:""}</p></div><div className="h-1.5 overflow-hidden rounded-full bg-white/12"><div className={"h-full rounded-full "+(status==="overdue"?"bg-rose-400":status==="dueSoon"?"bg-amber-300":"bg-emerald-400")} style={{width}}/></div></div>}
function Action({icon,label}:{icon:ReactNode;label:string}){return <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-white/15 bg-white/[.035] px-1 py-[.8vh] text-center [&_svg]:h-5 [&_svg]:w-5"><div className="mb-1 text-white/85">{icon}</div><span className="text-[clamp(.5rem,.65vw,.65rem)] text-white/75">{label}</span></div>}
function Status({icon,value,label}:{icon:ReactNode;value:string;label:string}){return <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/[.035] p-[.8vw] [&_svg]:h-5 [&_svg]:w-5"><div className="text-sky-200/80">{icon}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{value}</p><p className="truncate text-[10px] text-white/42">{label}</p></div></div>}
function rank(status:string){return status==="overdue"?0:status==="dueSoon"?1:status==="upcoming"?2:3}
function dueText(delta:number){return delta<0?Math.abs(delta).toLocaleString()+" mi overdue":delta.toLocaleString()+" mi"}
