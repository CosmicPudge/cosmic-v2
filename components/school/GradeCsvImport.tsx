"use client";

import { useState } from "react";
import type { Course, Grade } from "@/core/contracts/School";
import { courseGradeKey, COURSE_GRADE_CHANGED } from "@/services/school/courseGradeSummary";

type Candidate = { courseId: string; courseCode: string; grade: Grade; valid: boolean; issue?: string; selected: boolean; group?: string };
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
export default function GradeCsvImport({ courses, grades, saveGrade, scopeId }: { courses: Course[]; grades: Grade[]; saveGrade: (grade: Grade) => void; scopeId: string }) {
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
    if (!file.name.toLowerCase().endsWith(".pdf")) { setMessage("Unsupported file type. Choose a Canvas Print Grades PDF."); return; }
    if (file.size > 25_000_000) { setMessage(`This PDF is ${(file.size / 1_000_000).toFixed(1)} MB. The local importer supports PDFs up to 25 MB.`); return; }
    setPdfBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      if (pdf.numPages > 30) throw new Error("PDF must have 30 pages or fewer.");
      const matchedCourse = courses.find((course) => course.id === pdfCourseId);
      if (!matchedCourse) throw new Error("Choose a valid course.");
      const records: Array<{label:string;earned:number;possible:number;group?:string}> = [];
      let canvasTotal: string | undefined;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        type Fragment = { x: number; y: number; text: string };
        const fragments: Fragment[] = [];
        for (const element of content.items) {
          if (!("str" in element) || !element.str.trim()) continue;
          const item = element as { str: string; transform: number[] };
          fragments.push({ x: item.transform[4], y: item.transform[5], text: item.str.trim() });
        }
        // Canvas Print Grades uses a table: assignment titles in the left
        // column, dates in the middle, and scores on the far right.
        // Never combine text across those columns or across score rows.
        const pageWidth = page.getViewport({ scale: 1 }).width;
        const leftLimit = pageWidth * 0.36;
        const scoreLimit = pageWidth * 0.73;
        const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
        // PDF.js returns score cells as separate "10", "/", "10" glyphs.
        // Group glyphs on the same visual baseline before parsing a score.
        const scoreLines = new Map<number, Fragment[]>();
        for (const part of sorted.filter((part) => part.x >= scoreLimit && part.x < pageWidth * 0.92)) {
          const y = Math.round(part.y / 3) * 3;
          scoreLines.set(y, [...(scoreLines.get(y) ?? []), part]);
        }
        const scoredRows: Array<{ y: number; earned: number; possible: number }> = [];
        const orderedScoreLines = [...scoreLines.entries()].map(([y, parts]) => ({
          y, value: parts.sort((a,b) => a.x - b.x).map((part) => part.text).join(" ").replace(/\s+/g," ").trim(),
        })).sort((a,b)=>b.y-a.y);
        for (let i=0; i<orderedScoreLines.length; i++) {
          const line = orderedScoreLines[i];
          let match = line.value.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
          // Canvas wraps wider numbers: "61.73 /" above "100".
          // Reconstruct only when the denominator appears immediately below.
          if (!match && /^(\d+(?:\.\d+)?)\s*\/$/.test(line.value)) {
            const next = orderedScoreLines[i+1];
            if (next && line.y-next.y>4 && line.y-next.y<23 && /^\d+(?:\.\d+)?$/.test(next.value)) {
              match = (line.value+" "+next.value).match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
              if (match) i++;
            }
          }
          if (!match) continue; // A missing "- / 100" remains ungraded.
          const earned=Number(match[1]), possible=Number(match[2]);
          if (possible>0&&earned>=0) scoredRows.push({y:line.y,earned,possible});
        }
        const leftLines = new Map<number, Fragment[]>();
        for (const part of sorted.filter((part) => part.x < leftLimit)) {
          const y = Math.round(part.y / 3) * 3;
          leftLines.set(y, [...(leftLines.get(y) ?? []), part]);
        }
        const lines = [...leftLines.entries()].map(([y, parts]) => ({
          y, text: parts.sort((a,b) => a.x - b.x).map((part) => part.text).join(" ").replace(/\s+/g," ").trim(),
        })).sort((a,b) => b.y - a.y);
        const groupLabel = /^(Lecture Assignments|Math Primer Assignments|Weekly Progress Reports|Mini-Project(?: \(Playground Project\))?|Mars Mission Project(?: \(Final Project\))?|Attendance|Imported Assignments|Additional Surveys|Midterms|Proctored midterm exams|Out-of-class midterm exams for(?: extra credit)?|On line chapter quizzes|week in review quizzes|Week in Review Quizzes, highest(?: of 2 attempts)?|Final exam|Wooclap in-class polling)$/i;
        const otherLabel = /^(Name|Due|Submitted|Status|Score|Course|Arrange By|Apply|Print Grades|Grades for|Total)\b/i;
        const dateLine = /^(Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d+\b/i;
        const isTitle = (text: string) => text.length > 1 && !groupLabel.test(text) && !otherLabel.test(text) &&
          !dateLine.test(text) && !/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(text);
        // Locate each score's assignment title immediately to its left.
        // Multi-line names occupy the same or preceding line; stop at 2 lines.
        for (const score of scoredRows) {
          // A long assignment title can wrap below the score's numerator,
          // while its category subtitle appears even farther below. Canvas
          // PDFs frequently put the score denominator on a second line too.
          const candidateLines = lines.filter((line) => Math.abs(line.y - score.y) <= 19 && isTitle(line.text) &&
            !/^(Proctored midterm exams|Out-of-class midterm exams|On line chapter quizzes|week in review quizzes|Midterms|Wooclap in-class polling)\\b/i.test(line.text));
          const selected = candidateLines.sort((a,b) => b.y - a.y);
          const label = selected.map((line) => line.text).join(" ").replace(/\\s+Out-of-class midterm exams for(?: extra credit)?$/i,"").replace(/\s+(?:Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d{1,2}\s+by\b.*$/i, "").trim();
          const below = lines.filter((line) => line.y < score.y - 5 && line.y > score.y - 32).sort((a,b) => b.y - a.y);
          const group = below.map((line)=>line.text).find((text)=>groupLabel.test(text));
          if (label && !/^\\d/.test(label) && label.length <= 180) records.push({ label, earned: score.earned, possible: score.possible, ...(group?{group}:{}) });
        }
        const totals = fragments.map((part) => part.text).filter((t) => /^\d+(?:\.\d+)?%$/.test(t));
        if (totals.length) canvasTotal = totals[totals.length - 1];
      }
      if (!records.length) throw new Error("No reliably scored assignments found. This importer supports text-based Canvas Print Grades PDFs. Use CSV for scanned PDFs.");
      const seen=new Set<string>();
      const proposals:Candidate[]=records.map((record)=>{
        let label=record.label.replace(/\s+/g," ").trim();
        let group=record.group;
        // Canvas sometimes places the assignment-group subtitle on the same
        // extracted text line as its title (especially Chemistry quizzes).
        // Keep "high score" in the assignment title; detach only known
        // category subtitles at the end.
        const subtitle=label.match(/\s+(Week in Review Quizzes,\s*highest)\s*$/i);
        if(subtitle){group=group??subtitle[1];label=label.slice(0,subtitle.index).trim();}
        const key=label.toLowerCase();
        const duplicate=seen.has(key)||grades.some((grade)=>grade.courseId===pdfCourseId&&(grade.label??"").toLowerCase()===key);
        // PDF text extraction can concatenate distinct visual rows. Treat titles
        // containing layout remnants as unsafe, even if the score is numeric.
        const suspicious=/[\u2580-\u259f\u25a0-\u25ff\uE000-\uF8FF]|\b(?:Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d{1,2}\b|\b(?:am|pm)\b|\b(?:Lecture Assignments|Math Primer Assignments|Weekly Progress Reports)\b|\b(?:by|Submitted|Status)\b/i.test(label);
        seen.add(key);
        const issue=suspicious?"PDF row text appears merged; do not import":duplicate?"Already imported or duplicated":undefined;
        return { courseId:pdfCourseId,courseCode:matchedCourse.code||matchedCourse.name, group,
          grade:{id:crypto.randomUUID(),courseId:pdfCourseId,label,earnedPoints:record.earned,possiblePoints:record.possible},
          valid:!issue,selected:!issue,...(issue?{issue}:{}) };
      });
      setCandidates(proposals); setFileName(file.name);
      setMessage("Extracted "+proposals.length+" scored entries from Canvas PDF."+(canvasTotal?" Canvas reports "+canvasTotal+" overall; Cosmos does not replicate weighted categories.":"")+" Check every assignment name and score before saving. Ungraded entries are excluded.");
    } catch (error) { setMessage(error instanceof Error?error.message:"Could not read PDF."); }
    finally { setPdfBusy(false); }
  }
  function importSelected() {
    if (!confirmed) return;
    const selected = candidates.filter((item) => item.valid && item.selected);
    // Use existing records for mapping when a PDF is re-imported.
    // Their IDs remain stable; their scores must never be overwritten.
    const mapping = candidates.filter((item) => item.group && (item.valid && item.selected || item.issue === "Already imported or duplicated"));
    const course = courses.find((item) => item.id === pdfCourseId);
    if (course && mapping.length) {
      const key = courseGradeKey(scopeId,course);
      try {
        const current = JSON.parse(window.localStorage.getItem(key)||"null") as {groups?:Array<{id:string;name:string;weight:number|null}>;assignments?:Record<string,string>;gradeScale?:Record<string,number>}|null;
        const groups = Array.isArray(current?.groups)?[...current.groups]:[];
        const assignments = {...(current?.assignments??{})};
        for(const entry of mapping) {
          const name = entry.group!;
          let group = groups.find((item)=>item.name.trim().toLowerCase()===name.trim().toLowerCase());
          if(!group){group={id:crypto.randomUUID(),name,weight:null};groups.push(group);}
          const existing = grades.find((item)=>item.courseId===entry.courseId&&(item.label??"").trim().toLowerCase()===(entry.grade.label??"").trim().toLowerCase());
          const id = existing?.id??entry.grade.id;
          if(id && !assignments[id])assignments[id]=group.id;
        }
        window.localStorage.setItem(key,JSON.stringify({groups,assignments,...(current?.gradeScale?{gradeScale:current.gradeScale}:{})}));
        window.dispatchEvent(new Event(COURSE_GRADE_CHANGED));
      }catch{setMessage("Grades were not saved because the local grading structure could not be read.");return;}
    }
    selected.forEach((item) => saveGrade(item.grade));
    setMessage("Saved "+selected.length+" new grade records and recognized "+new Set(mapping.map((item)=>item.group)).size+" grading groups. New groups have unknown weights until you enter them.");
    setCandidates([]); setConfirmed(false);
  }
  function downloadTemplate() {
    const blob = new Blob([example+"\n"],{type:"text/csv;charset=utf-8"});
    const href = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=href; a.download="cosmos-grade-import-template.csv"; a.click(); URL.revokeObjectURL(href);
  }
  const selectedCount=candidates.filter((c)=>c.valid&&c.selected).length;
  const mappedCount=candidates.filter((c)=>c.group && (c.selected || c.issue==="Already imported or duplicated")).length;
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
        <span className="min-w-0 break-words"><span className="font-semibold">{candidate.courseCode}</span> · {candidate.grade.label}{candidate.group ? " · Group: "+candidate.group : ""} · {candidate.grade.letter ?? (candidate.grade.earnedPoints ?? "—")+"/"+(candidate.grade.possiblePoints??"—")}{candidate.issue && <span className="block text-amber-200">Skipped: {candidate.issue}</span>}</span>
      </label>)}
      </div>
      <label className="flex items-start gap-2 text-sm text-white/70"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e)=>setConfirmed(e.target.checked)}/> I reviewed the selected grades and want to save them to Cosmos.</label>
      <button type="button" disabled={!confirmed||(selectedCount===0&&mappedCount===0)} onClick={importSelected} className="rounded-lg border border-violet-300/40 px-4 py-2 text-sm text-white disabled:opacity-40">Save {selectedCount} grades and recognized groups</button>
    </div>}
  </section>;
}
