"use client";

import { useEffect, useState } from "react";
import type { Course, Grade } from "@/core/contracts/School";
import { COURSE_GRADE_CHANGED, DEFAULT_GRADE_SCALE } from "@/services/school/courseGradeSummary";

type Group = { id: string; name: string; weight: number | null };
type Structure = { groups: Group[]; assignments: Record<string,string>; gradeScale?: Record<string,number>; canvasLetter?: string; canvasPercent?: number };
const field = "rounded-lg border border-violet-300/20 bg-[#101a32] p-2 text-sm text-white";
const defaultStructure: Structure = {groups:[],assignments:{}};
const pct=(n:number)=>n.toFixed(1)+"%";
export default function CourseGradingStructure({ course, grades, scopeId }: { course: Course; grades: Grade[]; scopeId: string }) {
  const key = "cosmos.school.grading.v1."+scopeId+"."+course.termId+"."+course.id;
  const [model,setModel]=useState<Structure>(defaultStructure);
  const [loaded,setLoaded]=useState(false);
  const [newName,setNewName]=useState("");
  const [newWeight,setNewWeight]=useState("0");
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    setLoaded(false);
    try {
      const data=JSON.parse(window.localStorage.getItem(key) || "null") as Structure|null;
      setModel(data&&Array.isArray(data.groups)&&data.assignments&&typeof data.assignments==="object"?data:defaultStructure);
    } catch {setModel(defaultStructure);}
    setLoaded(true);
  },[key]);
  useEffect(()=>{if(loaded)try{window.localStorage.setItem(key,JSON.stringify(model));window.dispatchEvent(new Event(COURSE_GRADE_CHANGED));}catch{}},[key,loaded,model]);
  useEffect(()=>{const reload=()=>{try{const data=JSON.parse(window.localStorage.getItem(key)||"null") as Structure|null;if(data?.groups&&data.assignments)setModel((old)=>JSON.stringify(old)===JSON.stringify(data)?old:data);}catch{}};window.addEventListener(COURSE_GRADE_CHANGED,reload);return()=>window.removeEventListener(COURSE_GRADE_CHANGED,reload);},[key]);
  function addGroup(){
    const weight=newWeight.trim()===""?null:Number(newWeight);
    if(!newName.trim()||(weight!==null&&(!Number.isFinite(weight)||weight<0||weight>100))||model.groups.some((g)=>g.name.toLowerCase()===newName.trim().toLowerCase()))return;
    setModel((current)=>({...current,groups:[...current.groups,{id:crypto.randomUUID(),name:newName.trim(),weight}]}));
    setNewName("");setNewWeight("");
  }
  function updateGroup(id:string,patch:Partial<Group>){setModel((current)=>({...current,groups:current.groups.map((g)=>g.id===id?{...g,...patch}:g)}));}
  function deleteGroup(id:string){setModel((current)=>({groups:current.groups.filter((g)=>g.id!==id),assignments:Object.fromEntries(Object.entries(current.assignments).filter(([,value])=>value!==id))}));}
  const totalWeight=model.groups.reduce((sum,g)=>sum+(g.weight??0),0);
  const gradeEntries=grades.filter((g)=>g.id && g.earnedPoints!==undefined && g.possiblePoints!==undefined && g.possiblePoints>0);
  const aggregates=model.groups.map((group)=>{
    const assigned=gradeEntries.filter((g)=>model.assignments[g.id!]===group.id);
    const earned=assigned.reduce((sum,g)=>sum+(g.earnedPoints??0),0);
    const possible=assigned.reduce((sum,g)=>sum+(g.possiblePoints??0),0);
    return {...group,earned,possible,percentage:possible>0?earned/possible*100:null};
  });


  const unassigned=gradeEntries.filter((g)=>!model.groups.some((group)=>group.id===model.assignments[g.id!]));
  return <div className="mt-4 rounded-xl border border-violet-300/20 bg-[#100b29]/30 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-semibold text-white">Grading structure</h3><p className="mt-1 text-xs text-white/50">Specific to {course.code||course.name} · this term · saved in this browser</p></div>
      <button type="button" className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white" onClick={()=>setOpen((v)=>!v)}>{open?"Hide":"Configure"} groups</button>
    </div>
    {model.canvasPercent!==undefined&&<p className="mt-3 text-sm font-semibold text-emerald-200">Canvas-reported overall total: {pct(model.canvasPercent)}{model.canvasLetter?" · "+model.canvasLetter:" · Letter grade not recorded"}</p>}

    {model.groups.some((g)=>g.weight===null)&&<p className="mt-2 text-xs text-amber-200">Enter the missing group weights before calculating a course grade.</p>}
    {totalWeight>100.001&&<p className="mt-2 text-sm text-amber-200">Group weights exceed 100%. Correct them before relying on this estimate.</p>}
    {model.groups.length>0&&Math.abs(totalWeight-100)>0.01&&totalWeight<=100.001&&<p className="mt-2 text-xs text-amber-200">Group weights currently total {pct(totalWeight)}, not 100%.</p>}
    {unassigned.length>0&&model.groups.length>0&&<p className="mt-2 text-xs text-amber-200">{unassigned.length} scored assignments need a grading group. The weighted estimate is incomplete until they are categorized.</p>}
    {open&&<div className="mt-4 space-y-4">
      <div className="rounded-lg border border-violet-300/25 p-3"><h4 className="font-semibold text-white">Current grade shown in Canvas</h4><p className="mt-1 text-xs text-white/55">Use the current overall course grade from Canvas when its weighting or grading scheme differs from our estimate. This is a manual snapshot, not a live Canvas connection.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs text-white/70">Canvas letter grade<select aria-label="Canvas-reported overall letter grade" className={field+" mt-1 w-full"} value={model.canvasLetter??""} onChange={(e)=>setModel((current)=>({...current,canvasLetter:e.target.value||undefined}))}><option value="">Not entered</option>{["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"].map((value)=><option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs text-white/70">Canvas overall % (optional)<input aria-label="Canvas-reported overall percentage" className={field+" mt-1 w-full"} type="number" min="0" max="100" step="0.01" value={model.canvasPercent??""} onChange={(e)=>{const v=e.target.value;if(v===""||(Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=100))setModel((current)=>({...current,canvasPercent:v===""?undefined:Number(v)}));}} /></label></div>{model.canvasLetter&&<p className="mt-2 text-sm text-emerald-200">Canvas-reported grade: {model.canvasLetter}{model.canvasPercent!==undefined?" · "+model.canvasPercent.toFixed(2)+"%":""}. Used for semester GPA.</p>}</div>
      <div className="space-y-2">{aggregates.map((g)=><div key={g.id} className="flex flex-wrap items-center gap-2 text-sm">
        <input aria-label={"Group name "+g.name} className={field+" min-w-0 flex-1"} value={g.name} maxLength={100} onChange={(e)=>updateGroup(g.id,{name:e.target.value})}/>
        <input aria-label={"Weight for "+g.name} className={field+" w-20"} type="number" min="0" max="100" step="0.5" value={g.weight??""} onChange={(e)=>{const w=e.target.value===""?null:Number(e.target.value);if(w===null||(Number.isFinite(w)&&w>=0&&w<=100))updateGroup(g.id,{weight:w});}}/>
        <span className="text-xs text-white/50">%</span><span className="text-xs text-white/55">{g.percentage===null?"Not graded":pct(g.percentage)}</span>
        <button type="button" className="text-xs text-red-200" onClick={()=>deleteGroup(g.id)}>Remove</button>
      </div>)}</div>
      <div className="flex flex-wrap gap-2">
        <input aria-label="New group name" placeholder="Assignment group" className={field+" min-w-44 flex-1"} value={newName} maxLength={100} onChange={(e)=>setNewName(e.target.value)}/>
        <input aria-label="New group weight" type="number" min="0" max="100" step="0.5" className={field+" w-20"} value={newWeight} onChange={(e)=>setNewWeight(e.target.value)}/>
        <button type="button" className="rounded-lg border border-violet-300/30 px-3 py-2 text-sm text-white" onClick={addGroup}>Add group</button>
      </div>
      <div className="hidden"><h4 className="text-sm font-semibold text-white">Course letter-grade scale</h4><p className="mt-1 text-xs text-white/45">Minimum percentage for each letter. Defaults are estimates; enter the cutoffs from this course’s syllabus or Canvas grading scheme.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(DEFAULT_GRADE_SCALE).map(([letter,defaultCutoff])=><label key={letter} className="text-xs text-white/70">{letter} minimum %<input aria-label={letter+" minimum percentage"} className={field+" mt-1 w-full"} type="number" min="0" max="100" step="0.1" value={model.gradeScale?.[letter]??defaultCutoff} onChange={(e)=>{const number=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(number)&&number>=0&&number<=100)setModel((current)=>({...current,gradeScale:{...DEFAULT_GRADE_SCALE,...current.gradeScale,[letter]:number}}));}}/></label>)}</div></div>
      <h4 className="text-sm font-semibold text-white">Assign scored grades to groups</h4>
      <div className="max-h-80 space-y-2 overflow-auto">
        {gradeEntries.map((grade)=><label key={grade.id} className="flex flex-col gap-1 text-xs text-white/65 sm:flex-row sm:items-center">
          <span className="min-w-0 flex-1 break-words">{grade.label||"Grade"} · {grade.earnedPoints}/{grade.possiblePoints}</span>
          <select aria-label={"Grading group for "+(grade.label||"grade")} className={field+" w-full sm:w-60"} value={model.assignments[grade.id!]??""} onChange={(e)=>setModel((current)=>({...current,assignments:{...current.assignments,[grade.id!]:e.target.value}}))}>
            <option value="">Unassigned</option>{model.groups.map((g)=><option key={g.id} value={g.id}>{g.name} ({g.weight===null?"Weight not set":g.weight+"%"})</option>)}
          </select>
        </label>)}
      </div>
      <p className="text-xs text-white/45">Canvas may apply dropped scores, extra credit, manual adjustments, and other rules. This is an estimate, not an official Canvas grade. Empty groups are excluded from the weighted calculation.</p>
    </div>}
  </div>;
}
