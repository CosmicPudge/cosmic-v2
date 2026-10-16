"use client";

import { useState } from "react";
import type { Course, Grade } from "@/core/contracts/School";

type Candidate = { courseId: string; courseCode: string; grade: Grade; valid: boolean; issue?: string; selected: boolean };
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV contains an unmatched quotation mark.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
const LETTERS = new Set(["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F"]);
const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");
const tokens = (v: string) => v.toUpperCase().match(/[A-Z]+|\d+/g)?.join(" ") ?? "";
const field = "w-full rounded-lg border border-violet-200/20 bg-[#160e30] px-3 py-2 text-sm text-white";
const example = 'course,assignment,letter,earned,possible\nCHEM 1210,Course grade,B+,,\nMATH 1060,Quiz 1,,18,20';
export default function GradeCsvImport({ courses, grades, saveGrade }: { courses: Course[]; grades: Grade[]; saveGrade: (grade: Grade) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pdfCourseId, setPdfCourseId] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  async function readFile(file?: File) {
    if (!file) return;
    setMessage(""); setCandidates([]); setConfirmed(false);
    if (file.size > 250_000 || !/\.csv$|\.txt$/i.test(file.name)) { setMessage("Select a CSV or plain-text file smaller than 250 KB."); return; }
    try {
      const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
      if (rows.length < 2 || rows.length > 1001) throw new Error("The file must have a header and 1–1000 grade rows.");
      const headers = rows[0].map((v) => v.trim().toLowerCase().replace(/[\s_-]/g,""));
      const index = (names: string[]) => headers.findIndex((v) => names.includes(v));
      const course = index(["course","coursecode","class"]);
      const title = index(["assignment","label","title","gradelabel"]);
      const letter = index(["letter","lettergrade","grade"]);
      const earned = index(["earned","earnedpoints","score","pointsearned"]);
      const possible = index(["possible","possiblepoints","pointspossible","outof"]);
      if (course < 0 || (letter < 0 && (earned < 0 || possible < 0))) throw new Error("Required: course plus letter, or course plus earned and possible. See the CSV example.");
      const seen = new Set<string>();
      const parsed = rows.slice(1).map((row): Candidate => {
        const code = row[course] ?? "";
        const hit = courses.filter((entry) => clean(entry.code ?? "") === clean(code) || tokens(entry.code ?? "") === tokens(code));
        const id = hit.length === 1 ? hit[0].id : "";
        const label = (title >= 0 ? row[title] : "")?.trim() || "Imported course grade";
        const l = letter >= 0 ? (row[letter] ?? "").toUpperCase().trim() : "";
        const e = earned >= 0 ? (row[earned] ?? "").trim() : "";
        const p = possible >= 0 ? (row[possible] ?? "").trim() : "";
        const hasPoints = Boolean(e || p);
        const validPoints = !hasPoints || (e !== "" && p !== "" && Number.isFinite(Number(e)) && Number.isFinite(Number(p)) && Number(e) >= 0 && Number(p) > 0);
        const grade: Grade = { id: crypto.randomUUID(), courseId: id, label, ...(l ? {letter:l}:{}), ...(hasPoints && validPoints ? {earnedPoints:Number(e),possiblePoints:Number(p)}:{}) };
        const key = id + "|" + label.toLowerCase();
        const duplicate = seen.has(key) || grades.some((g) => g.courseId === id && (g.label ?? "").toLowerCase() === label.toLowerCase());
        seen.add(key);
        const issue = !id ? "Course not uniquely matched" : l && !LETTERS.has(l) ? "Invalid letter grade" : !validPoints ? "Invalid points" : !l && !hasPoints ? "No grade value" : duplicate ? "Already recorded or repeated in file" : undefined;
        return { courseId:id,courseCode:code,grade,valid:!issue,issue,selected:!issue };
      });
      setCandidates(parsed); setFileName(file.name); setMessage("Review the proposed imports below. Existing grades are never overwritten.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to read grades file."); }
  }
  async function readPdf(file?: File) {
    if (!file) return;
    setMessage(""); setCandidates([]); setConfirmed(false);
    if (!pdfCourseId) { setMessage("Choose which Cosmos course this Canvas grade report belongs to."); return; }
    if (!/\\.pdf$/i.test(file.name) || file.size > 8_000_000) { setMessage("Choose a PDF smaller than 8 MB."); return; }
    setPdfBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      if (pdf.numPages > 30) throw new Error("PDF must have 30 pages or fewer.");
      const matchedCourse = courses.find((course) => course.id === pdfCourseId);
      if (!matchedCourse) throw new Error("Choose a valid course.");
      const records: Array<{label:string;earned:number;possible:number}> = [];
      let canvasTotal: string | undefined;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = new Map<number, Array<{x:number;text:string}>>();
        for (const element of content.items) {
          if (!("str" in element) || !element.str.trim()) continue;
          const item = element as {str:string;transform:number[]};
          const y = Math.round(item.transform[5] / 4) * 4;
          const line = lines.get(y) ?? []; line.push({ x:item.transform[4], text:item.str.trim() }); lines.set(y,line);
        }
        const sorted = [...lines.entries()].sort((a,b)=>b[0]-a[0]).map(([,cells])=>cells.sort((a,b)=>a.x-b.x));
        let pending = "";
        let inRows = false;
        for (const cells of sorted) {
          const line = cells.map((cell)=>cell.text).join(" ").replace(/\s+/g," ").trim();
          if (/^Name\b.*\bDue\b/i.test(line)) { inRows=true; pending=""; continue; }
          if (/^Total\s+(\d+(?:\.\d+)?)%/.test(line)) { canvasTotal=line.match(/\d+(?:\.\d+)?%/)?.[0]; inRows=false; continue; }
          if (/^(Lecture Assignments|Attendance|Math Primer Assignments|Weekly Progress Reports|Mini-Project \(Playground Project\)|Imported Assignments|Additional Surveys)/i.test(line) && !/\d+\s*\/\s*\d+/.test(line)) continue;
          if (/^Total\b|^Course\s+Arrange By|^Grades for |^Print Grades|^Name\s+Due/i.test(line)) { pending=""; continue; }
          if (!inRows) continue;
          const scores = [...line.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?=\s|$)/g)];
          if (scores.length) {
            const score = scores[scores.length - 1];
            const earned=Number(score[1]), possible=Number(score[2]);
            const textBefore=line.slice(0,score.index).replace(/(?:Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d+.*$/i,"").trim();
            const candidate=(pending+" "+textBefore).replace(/\s+/g," ").trim();
            if (candidate && possible > 0 && earned >= 0 && !/^(Lecture Assignments|Attendance|Math Primer Assignments|Weekly Progress Reports|Mini-Project|Total|Seminar Attendance W\d+\s+\d+)/i.test(candidate)) records.push({label:candidate,earned,possible});
            pending="";
          } else if (/\/\s*\d+/.test(line) || /\d+\.\d+%/.test(line)) {
            pending="";
          } else if (!/^(Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d+\b|^\d+:\d+|^by |^am$|^pm$|^Submitted|^Status|^Score|^Assignment/i.test(line) && !/\b\d+\s*\/\s*$/.test(line)) {
            pending=(pending+" "+line).trim().slice(-200);
          }
        }
      }
      if (!records.length) throw new Error("No reliably scored assignments found. This importer supports text-based Canvas Print Grades PDFs. Use CSV for scanned PDFs.");
      const seen=new Set<string>();
      const proposals:Candidate[]=records.map((record)=>{
        const label=record.label.replace(/\\s+/g," ").trim();
        const key=label.toLowerCase();
        const duplicate=seen.has(key)||grades.some((grade)=>grade.courseId===pdfCourseId&&(grade.label??"").toLowerCase()===key);
        seen.add(key);
        return { courseId:pdfCourseId,courseCode:matchedCourse.code||matchedCourse.name,
          grade:{id:crypto.randomUUID(),courseId:pdfCourseId,label,earnedPoints:record.earned,possiblePoints:record.possible},
          valid:!duplicate,selected:!duplicate,...(duplicate?{issue:"Already imported or duplicated"}:{}) };
      });
      setCandidates(proposals); setFileName(file.name);
      setMessage("Extracted "+proposals.length+" scored entries from Canvas PDF."+(canvasTotal?" Canvas reports "+canvasTotal+" overall; Cosmos does not replicate weighted categories.":"")+" Check every assignment name and score before saving. Ungraded entries are excluded.");
    } catch (error) { setMessage(error instanceof Error?error.message:"Could not read PDF."); }
    finally { setPdfBusy(false); }
  }
  function importSelected() {
    if (!confirmed) return;
    const selected = candidates.filter((item) => item.valid && item.selected);
    selected.forEach((item) => saveGrade(item.grade));
    setMessage("Saved " + selected.length + " reviewed grade records to this School workspace.");
    setCandidates([]); setConfirmed(false);
  }
  function downloadTemplate() {
    const blob = new Blob([example+"\n"],{type:"text/csv;charset=utf-8"});
    const href = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=href; a.download="cosmos-grade-import-template.csv"; a.click(); URL.revokeObjectURL(href);
  }
  const selectedCount=candidates.filter((c)=>c.valid&&c.selected).length;
  return <section className="rounded-2xl border border-violet-200/20 bg-violet-950/15 p-5">
    <h2 className="text-lg font-semibold text-white">Import grades from a file</h2>
    <p className="mt-2 text-sm text-white/60">Offline PDF or CSV import for your own course grades and assignment scores. No Canvas account access required. This runs locally in your browser; review each matched grade before saving. This is not an official transcript import.</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" className="rounded-lg border border-violet-300/30 px-3 py-2 text-sm text-white hover:bg-violet-300/10" onClick={downloadTemplate}>Download CSV template</button>
      <label className="min-w-0 text-sm text-white/70">Choose CSV file<input aria-label="Choose grade CSV file" className={field+" mt-1 block max-w-full"} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event)=>void readFile(event.target.files?.[0])}/></label>
    </div>
    <div className="mt-4 rounded-lg border border-white/10 p-3">
      <p className="text-sm font-semibold text-white">Canvas Print Grades PDF</p>
      <p className="mt-1 text-xs text-white/55">Choose the matching course, then upload a text-based Canvas Print Grades PDF. Only scored assignments are proposed, and all results need your approval.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <select aria-label="Course for PDF grade import" className={field} value={pdfCourseId} onChange={(e)=>setPdfCourseId(e.target.value)}><option value="">Select the course in this PDF</option>{courses.map((course)=><option key={course.id} value={course.id}>{course.code||course.name} · {course.name}</option>)}</select>
        <input aria-label="Choose Canvas grade PDF" type="file" accept=".pdf,application/pdf" className={field} disabled={pdfBusy} onChange={(e)=>void readPdf(e.target.files?.[0])}/>
      </div>
      {pdfBusy&&<p role="status" className="mt-2 text-xs text-white/60">Reading the PDF locally…</p>}
    </div>
    <p className="mt-2 text-xs text-white/45">Columns: course, assignment, letter, earned, possible. Use a course code such as CHEM 1210. Points and letter may be left blank individually, not both. Grade rows with unrecognized courses or duplicate labels are skipped.</p>
    {message && <p role="status" className="mt-3 text-sm text-violet-100/80">{message}</p>}
    {candidates.length > 0 && <div className="mt-4 space-y-3">
      <p className="text-sm text-white/70">{fileName} · {candidates.length} rows · {selectedCount} selected</p>
      <div className="max-h-80 space-y-2 overflow-auto">
      {candidates.map((candidate,i)=><label key={i} className="flex items-start gap-3 rounded-lg border border-white/10 p-3 text-sm text-white/75">
        <input type="checkbox" className="mt-1" disabled={!candidate.valid} checked={candidate.selected} onChange={(e)=>setCandidates((old)=>old.map((v,j)=>i===j?{...v,selected:e.target.checked}:v))}/>
        <span className="min-w-0 break-words"><span className="font-semibold">{candidate.courseCode}</span> · {candidate.grade.label} · {candidate.grade.letter ?? (candidate.grade.earnedPoints ?? "—")+"/"+(candidate.grade.possiblePoints??"—")}{candidate.issue && <span className="block text-amber-200">Skipped: {candidate.issue}</span>}</span>
      </label>)}
      </div>
      <label className="flex items-start gap-2 text-sm text-white/70"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e)=>setConfirmed(e.target.checked)}/> I reviewed the selected grades and want to save them to Cosmos.</label>
      <button type="button" disabled={!confirmed||selectedCount===0} onClick={importSelected} className="rounded-lg border border-violet-300/40 px-4 py-2 text-sm text-white disabled:opacity-40">Save {selectedCount} selected grades</button>
    </div>}
  </section>;
}
