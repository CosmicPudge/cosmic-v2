"use client";

import { useState } from "react";
import type { Course, Grade } from "@/core/contracts/School";
import { courseGradeKey, COURSE_GRADE_CHANGED } from "@/services/school/courseGradeSummary";

type Candidate = { courseId: string; courseCode: string; grade: Grade; valid: boolean; issue?: string; selected: boolean; group?: string; action?: "add"|"update"|"unchanged" };
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
const gradeIdentity = (title: string) => title.toLowerCase()
  .replace(/\b(?:sep|oct|nov|dec|jan|feb|mar|apr|may|jun|jul|aug)\s+\d{1,2}\s+by\b.*$/i, "")
  .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)\b/gi, "")
  .replace(/\bweek in review quizzes,?\s*highest(?:\s+of\s+2\s+attempts)?\b/gi, "")
  .replace(/\bof\s+2\s+attempts\s*$/i, "")
  .replace(/\s+11\s+59\s*pm\b/gi,"")
  .replace(/[^a-z0-9]+/g, " ").trim();
const field = "w-full rounded-lg border border-violet-200/20 bg-[#160e30] px-3 py-2 text-sm text-white";
const example = 'course,assignment,letter,earned,possible\nCHEM 1210,Course grade,B+,,\nMATH 1060,Quiz 1,,18,20';
export default function GradeCsvImport({ courses, grades, saveGrade, removeGrade, scopeId }: { courses: Course[]; grades: Grade[]; saveGrade: (grade: Grade) => void; removeGrade: (id: string) => void; scopeId: string }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pdfCourseId, setPdfCourseId] = useState("");
  const [groupPhotoName,setGroupPhotoName] = useState("");
  const [photoBusy,setPhotoBusy] = useState(false);
  const [photoGroups,setPhotoGroups] = useState<Array<{name:string;weight:number}>>([]);
  const [groupPhotoUrl,setGroupPhotoUrl] = useState<string|null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfCanvasPercent,setPdfCanvasPercent] = useState<number | null>(null);
  const [cleanupIds,setCleanupIds] = useState<string[]>([]);
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
  async function readWeightPhoto(file?:File){
    if(groupPhotoUrl)URL.revokeObjectURL(groupPhotoUrl);
    setGroupPhotoName(file?.name??"");setGroupPhotoUrl(file?URL.createObjectURL(file):null);setPhotoGroups([]);
    if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>8_000_000){setMessage("Choose a PNG, JPG, or WebP screenshot under 8 MB.");return;}
    setPhotoBusy(true);
    try {
      const {createWorker}=await import("tesseract.js");
      const worker=await createWorker("eng");
      let raw="";
      try{raw=(await worker.recognize(file)).data.text;}
      finally{await worker.terminate();}
      const rows=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
      const parsed:Array<{name:string;weight:number}>=[];
      let pending="";
      for(const line of rows){
        if(/^group\s+weight$/i.test(line)||/^total\b/i.test(line))continue;
        const match=line.match(/^(.*?)\s+(\d{1,3})\s*%$/);
        if(match){
          const name=(pending+" "+match[1]).trim().replace(/\s+/g," ");
          const weight=Number(match[2]);pending="";
          if(name&&weight>=0&&weight<=100&&!parsed.some(row=>row.name.toLowerCase()===name.toLowerCase()))parsed.push({name,weight});
        }else if(!/^\d+\s*%$/.test(line)){pending=(pending+" "+line).trim();}
      }
      setPhotoGroups(parsed);
      setMessage(parsed.length?"Detected "+parsed.length+" groups from screenshot. Review names and weights.":"Couldn't confidently read weights. Try a clearer screenshot.");
    }catch(error){setMessage(error instanceof Error?"Screenshot recognition failed: "+error.message:"Screenshot recognition failed.");}
    finally{setPhotoBusy(false);}
  }
  async function readPdf(file?: File) {
    if (!file) return;
    setMessage(""); setCandidates([]); setConfirmed(false); setPdfCanvasPercent(null);

    if (!file.name.toLowerCase().endsWith(".pdf")) { setMessage("Unsupported file type. Choose a Canvas Print Grades PDF."); return; }
    if (file.size > 25_000_000) { setMessage(`This PDF is ${(file.size / 1_000_000).toFixed(1)} MB. The local importer supports PDFs up to 25 MB.`); return; }
    setPdfBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      if (pdf.numPages > 30) throw new Error("PDF must have 30 pages or fewer.");
      const pdfName=file.name.toUpperCase();
      const matchingCourses=courses.filter((course)=>{const code=(course.code||"").replace(/[^A-Z0-9]/gi,"").toUpperCase();return code.length>=5&&pdfName.replace(/[^A-Z0-9]/g,"").includes(code);});
      const matchedCourse = courses.find((course) => course.id === pdfCourseId)??(matchingCourses.length===1?matchingCourses[0]:undefined);
      if (!matchedCourse) throw new Error("Choose a valid course.");
      const detectedCourseId=matchedCourse.id;
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
        for (const part of sorted.filter((part) => part.x >= scoreLimit && part.x < pageWidth * 0.86)) {
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
        const groupLabel = /^(Lecture Assignments|Math Primer Assignments|Weekly Progress Reports|Mini-Project(?: \(Playground Project\))?|Mars Mission Project(?: \(Final Project\))?|Attendance|Imported Assignments|Additional Surveys|Midterms|Proctored midterm exams|Out-of-class midterm exams for(?: extra credit)?|On line chapter quizzes|week in review quizzes|Week in Review Quizzes, highest(?: of 2 attempts)?|Final exam|Wooclap in-class polling|Assignments in MyOpenMath|Quiz|Competency Based Exams)$/i;
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
          const candidateLines = lines.filter((line) => Math.abs(line.y - score.y) <= 22 && isTitle(line.text) &&
            !/^(Proctored midterm exams|Out-of-class midterm exams|On line chapter quizzes|week in review quizzes|Midterms|Wooclap in-class polling)\\b/i.test(line.text));
          const selected = candidateLines.sort((a,b) => b.y - a.y);
          const label = selected.map((line) => line.text).join(" ").replace(/\\s+Out-of-class midterm exams for(?: extra credit)?$/i,"").replace(/\s+(?:Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d{1,2}\s+by\b.*$/i, "").trim();
          const below = lines.filter((line) => line.y < score.y - 5 && line.y > score.y - 32).sort((a,b) => b.y - a.y);
          const group = below.map((line)=>line.text).find((text)=>groupLabel.test(text));
          if (label && !/^\\d/.test(label) && label.length <= 180) records.push({ label, earned: score.earned, possible: score.possible, ...(group?{group}:{}) });
        }
        // Some Canvas assignments are scored as a percentage instead of
        // points. Treat them as a score out of 100, but only when a distinct
        // assignment row can be identified to the left of the percent glyph.
        // Group-summary percentages never have an assignment title above them.
        const percentageCells=fragments.filter((part)=>part.x>=scoreLimit&&part.x<pageWidth*0.86&&/^\d+(?:\.\d+)?%$/.test(part.text));
        for(const cell of percentageCells){
          const nameLine=lines.find((line)=>Math.abs(line.y-cell.y)<=14&&
            /^(Roll Call Attendance)$/i.test(line.text));
          if(nameLine){
            const pctValue=Number(cell.text.replace("%",""));
            records.push({label:nameLine.text,earned:pctValue,possible:100,group:"Attendance"});
          }
        }
        // Canvas renders complete/incomplete Wooclap scores as private-use
        // icons rather than "1 / 1". In this Canvas print layout the score
        // checkmark is U+EA43 in the Score column, while U+EA42 in the
        // far-right Status column means feedback and must NOT count.
        // This course's Wooclap activities are worth 1 point each.
        const wooclapChecks = fragments.filter((part) =>
          part.text.includes("\uEA43") && part.x>=scoreLimit && part.x<pageWidth*0.86);
        for(const check of wooclapChecks){
          const nearby=lines.filter((line)=>line.y>=check.y-5&&line.y<=check.y+34).sort((a,b)=>b.y-a.y);
          const name=nearby.filter((line)=>/^wooclap\b/i.test(line.text)&&!/^Wooclap in-class polling$/i.test(line.text))
            .map((line)=>line.text).join(" ").replace(/\s+/g," ").trim();
          // Don't infer completion from icons without a matching assignment
          // and group. Leave ordinary ungraded / dash marks untouched.
          const groupFound=lines.some((line)=>/^Wooclap in-class polling$/i.test(line.text)&&
            line.y<=check.y+3&&line.y>=check.y-25);
          if(name&&groupFound&&name.length<=180)records.push({label:name,earned:1,possible:1,group:"Wooclap in-class polling"});
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
        const subtitle=label.match(/\s+(Week in Review Quizzes,\s*highest|Assignments in MyOpenMath|Competency Based Exams|Quiz)\s*$/i);
        if(subtitle){group=group??subtitle[1];label=label.slice(0,subtitle.index).trim();}
        const key=gradeIdentity(label);
        const existing=grades.find((grade)=>grade.courseId===detectedCourseId&&gradeIdentity(grade.label??"")===key);
        const repeated=seen.has(key);
        const action:Candidate["action"]=existing?(existing.earnedPoints===record.earned&&existing.possiblePoints===record.possible?"unchanged":"update"):"add";
        // PDF text extraction can concatenate distinct visual rows. Treat titles
        // containing layout remnants as unsafe, even if the score is numeric.
        const suspicious=/[\u2580-\u259f\u25a0-\u25ff\uE000-\uF8FF]|\b(?:Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug)\s+\d{1,2}\b|\b(?:am|pm)\b|\b(?:Lecture Assignments|Math Primer Assignments|Weekly Progress Reports)\b|\b(?:by|Submitted|Status)\b/i.test(label);
        seen.add(key);
        const issue=suspicious?"PDF row text appears merged; do not import":repeated?"Repeated row in PDF":action==="unchanged"?"Already up to date":undefined;
        return { courseId:detectedCourseId,courseCode:matchedCourse.code||matchedCourse.name, group, action,
          grade:{id:existing?.id??crypto.randomUUID(),courseId:detectedCourseId,label,earnedPoints:record.earned,possiblePoints:record.possible},
          valid:!issue,selected:!issue,...(issue?{issue}:{}) };
      });
      setPdfCanvasPercent(canvasTotal && Number.isFinite(Number.parseFloat(canvasTotal)) ? Number.parseFloat(canvasTotal) : null);
      setPdfCourseId(detectedCourseId);
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
    const mapping = candidates.filter((item) => item.group && ((item.valid && item.selected) || item.action === "unchanged"));
    const course = courses.find((item) => item.id === pdfCourseId);
    if (course && (mapping.length || pdfCanvasPercent !== null || photoGroups.length>0)) {
      const key = courseGradeKey(scopeId,course);
      try {
        const current = JSON.parse(window.localStorage.getItem(key)||"null") as {groups?:Array<{id:string;name:string;weight:number|null}>;assignments?:Record<string,string>;gradeScale?:Record<string,number>;canvasLetter?:string;canvasPercent?:number}|null;
        const groups = Array.isArray(current?.groups)?[...current.groups]:[];
        const assignments = {...(current?.assignments??{})};
        if(photoGroups.length&&Math.abs(photoGroups.reduce((sum,g)=>sum+g.weight,0)-100)>0.01){setMessage("Screenshot weights must total 100% before accepting.");return;}
        for(const item of photoGroups){const name=item.name.trim();if(!name)continue;const existing=groups.find((g)=>g.name.trim().toLowerCase()===name.toLowerCase());if(existing)existing.weight=item.weight;else groups.push({id:crypto.randomUUID(),name,weight:item.weight});}
        for(const entry of mapping) {
          const name = entry.group!;
          let group = groups.find((item)=>item.name.trim().toLowerCase()===name.trim().toLowerCase());
          if(!group){group={id:crypto.randomUUID(),name,weight:null};groups.push(group);}
          const existing = grades.find((item)=>item.courseId===entry.courseId&&gradeIdentity(item.label??"")===gradeIdentity(entry.grade.label??""));
          const id = existing?.id??entry.grade.id;
          if(id && !assignments[id])assignments[id]=group.id;
        }
        window.localStorage.setItem(key,JSON.stringify({groups,assignments,...(current?.gradeScale?{gradeScale:current.gradeScale}:{}),...(current?.canvasLetter?{canvasLetter:current.canvasLetter}:{}),...(pdfCanvasPercent!==null?{canvasPercent:pdfCanvasPercent}:current?.canvasPercent!==undefined?{canvasPercent:current.canvasPercent}:{})}));
        window.dispatchEvent(new Event(COURSE_GRADE_CHANGED));
      }catch{setMessage("Grades were not saved because the local grading structure could not be read.");return;}
    }
    selected.forEach((item) => saveGrade(item.grade));
    setMessage("Saved "+selected.length+" new grade records and recognized "+new Set(mapping.map((item)=>item.group)).size+" grading groups."+(pdfCanvasPercent!==null?" Canvas-reported overall percentage: "+pdfCanvasPercent+"%.":"")+" Enter the course letter grade separately if Canvas shows one.");
    setCandidates([]); setConfirmed(false); setPdfCanvasPercent(null);setPhotoGroups([]);
  }
  function downloadTemplate() {
    const blob = new Blob([example+"\n"],{type:"text/csv;charset=utf-8"});
    const href = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=href; a.download="cosmos-grade-import-template.csv"; a.click(); URL.revokeObjectURL(href);
  }
  const selectedCount=candidates.filter((c)=>c.valid&&c.selected).length;
  const newCount=candidates.filter((c)=>c.valid&&c.selected&&c.action!=="update").length;
  const updatedCount=candidates.filter((c)=>c.valid&&c.selected&&c.action==="update").length;
  const mappedCount=candidates.filter((c)=>c.group && (c.selected || c.action==="unchanged")).length;
  const duplicates = grades.filter((item)=>item.id&&courses.some((course)=>course.id===item.courseId)).filter((item,index,all)=>all.findIndex((other)=>other.courseId===item.courseId&&gradeIdentity(other.label??"")===gradeIdentity(item.label??"")&&other.earnedPoints===item.earnedPoints&&other.possiblePoints===item.possiblePoints)<index);
  const removable = duplicates.filter((grade)=>grade.id&&cleanupIds.includes(grade.id));
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
        <select aria-label="Course for PDF grade import" className={field} value={pdfCourseId} onChange={(e)=>setPdfCourseId(e.target.value)}><option value="">Auto-detect course from PDF filename</option>{courses.map((course)=><option key={course.id} value={course.id}>{course.code||course.name} · {course.name}</option>)}</select>
        <input aria-label="Choose Canvas grade PDF" type="file" accept=".pdf,application/pdf" className={field} disabled={pdfBusy} onChange={(e)=>void readPdf(e.target.files?.[0])}/>
      </div>
      <label className="mt-3 block text-xs text-white/65">Grading groups/weights screenshot (automatically read weights)<input className={field+" mt-1"} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>void readWeightPhoto(event.target.files?.[0])}/></label>
      {groupPhotoUrl&&<div className="mt-2"><p className="text-xs text-white/60">{groupPhotoName} · Detected weights below</p><img src={groupPhotoUrl} alt="Uploaded grading groups and weights reference" className="mt-2 max-h-60 w-auto rounded-lg border border-white/15"/></div>}
      {photoBusy&&<p className="mt-2 text-xs text-white/70">Reading group names and weights from the screenshot…</p>}
      {photoGroups.length>0&&<div className="mt-3 rounded-xl border border-violet-300/20 p-3"><p className="mb-2 text-sm font-semibold text-white">Detected groups — check before accepting</p>{photoGroups.map((group,i)=><div key={i} className="mb-2 flex gap-2"><input aria-label={"Group name "+(i+1)} className={field+" flex-1"} value={group.name} onChange={(e)=>setPhotoGroups((old)=>old.map((v,j)=>i===j?{...v,name:e.target.value}:v))}/><input aria-label={"Weight for "+group.name} className={field+" w-24"} type="number" min="0" max="100" value={group.weight} onChange={(e)=>setPhotoGroups((old)=>old.map((v,j)=>i===j?{...v,weight:Number(e.target.value)}:v))}/></div>)}<p className="text-xs text-white/60">Total {photoGroups.reduce((sum,g)=>sum+g.weight,0)}% — fix recognition errors before accepting.</p></div>}
      {pdfBusy&&<p role="status" className="mt-2 text-xs text-white/60">Reading the PDF locally…</p>}
    </div>
    <p className="mt-2 text-xs text-white/45">Columns: course, assignment, letter, earned, possible. Use a course code such as CHEM 1210. Points and letter may be left blank individually, not both. Grade rows with unrecognized courses or duplicate labels are skipped.</p>
    {message && <p role="status" className="mt-3 text-sm text-violet-100/80">{message}</p>}
    {duplicates.length>0&&<div className="mt-4 rounded-lg border border-amber-200/20 p-3">
      <h3 className="text-sm font-semibold text-amber-100">Review existing duplicate grade records ({duplicates.length})</h3>
      <p className="mt-1 text-xs text-white/55">Same course, normalized title, and exact score. Review each duplicate before removal. The first matching record is always kept.</p>
      <div className="mt-2 max-h-48 space-y-2 overflow-auto">{duplicates.map((grade)=><label key={grade.id} className="flex items-start gap-2 text-xs text-white/70"><input type="checkbox" checked={cleanupIds.includes(grade.id!)} onChange={(event)=>setCleanupIds((previous)=>event.target.checked?[...previous,grade.id!]:previous.filter((id)=>id!==grade.id))}/><span>{courses.find((course)=>course.id===grade.courseId)?.code} · {grade.label} · {grade.earnedPoints}/{grade.possiblePoints}</span></label>)}</div>
      <button type="button" className="mt-3 rounded-lg border border-amber-300/30 px-3 py-2 text-xs text-amber-100 disabled:opacity-40" disabled={removable.length===0} onClick={()=>{if(!window.confirm("Remove "+removable.length+" selected duplicate grade records? Original matching records will remain."))return;removable.forEach((grade)=>removeGrade(grade.id!));setCleanupIds([]);}}>Remove {removable.length} selected duplicates</button>
    </div>}

    {candidates.length > 0 && <div className="mt-4 space-y-3">
      <p className="text-sm text-white/70">{fileName} · {newCount} new · {updatedCount} changed · {candidates.filter((c)=>c.action==="unchanged").length} unchanged</p>
      <div className="max-h-80 space-y-2 overflow-auto">
      {candidates.map((candidate,i)=><label key={i} className="flex items-start gap-3 rounded-lg border border-white/10 p-3 text-sm text-white/75">
        <input type="checkbox" className="mt-1" disabled={!candidate.valid} checked={candidate.selected} onChange={(e)=>setCandidates((old)=>old.map((v,j)=>i===j?{...v,selected:e.target.checked}:v))}/>
        <span className="min-w-0 break-words"><span className="font-semibold">{candidate.courseCode}</span> · {candidate.action==="update"?"Updated score · ":candidate.action==="unchanged"?"Unchanged · ":"New · "}{candidate.grade.label}{candidate.group ? " · Group: "+candidate.group : ""} · {candidate.grade.letter ?? (candidate.grade.earnedPoints ?? "—")+"/"+(candidate.grade.possiblePoints??"—")}{candidate.issue && <span className="block text-amber-200">Skipped: {candidate.issue}</span>}</span>
      </label>)}
      </div>
      <label className="flex items-start gap-2 text-sm text-white/70"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e)=>setConfirmed(e.target.checked)}/> I reviewed the selected grades and want to save them to Cosmos.</label>
      <button type="button" disabled={!confirmed||(selectedCount===0&&mappedCount===0&&pdfCanvasPercent===null)} onClick={importSelected} className="rounded-lg border border-violet-300/40 px-4 py-2 text-sm text-white disabled:opacity-40">Accept {newCount} new, {updatedCount} updated grades</button>
    </div>}
  </section>;
}
