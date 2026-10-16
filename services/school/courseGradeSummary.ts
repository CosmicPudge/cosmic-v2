import type { Course, Grade } from "@/core/contracts/School";

type Group={id:string;name:string;weight:number|null};
type Structure={groups:Group[];assignments:Record<string,string>;gradeScale?:Record<string,number>;canvasLetter?:string;canvasPercent?:number};
export const DEFAULT_GRADE_SCALE:Record<string,number>={A:93,"A-":90,"B+":87,B:83,"B-":80,"C+":77,C:73,"C-":70,"D+":67,D:63,"D-":60,F:0};
export function gradeFromScale(percentage:number,scale:Record<string,number>=DEFAULT_GRADE_SCALE){return Object.entries(scale).filter(([letter,cutoff])=>GRADE_POINTS[letter]!==undefined&&Number.isFinite(cutoff)&&percentage>=cutoff).sort((a,b)=>b[1]-a[1])[0]?.[0]??"F";}
export const COURSE_GRADE_CHANGED="cosmos:school-course-grade-changed";
export const courseGradeKey=(scopeId:string,course:Course)=>"cosmos.school.grading.v1."+scopeId+"."+course.termId+"."+course.id;
export const GRADE_POINTS:Record<string,number>={"A+":4,A:4,"A-":3.7,"B+":3.3,B:3,"B-":2.7,"C+":2.3,C:2,"C-":1.7,"D+":1.3,D:1,"D-":0.7,F:0};
export function percentageLetter(p:number):string {
  if(p>=93)return "A";if(p>=90)return "A-";if(p>=87)return "B+";if(p>=83)return "B";if(p>=80)return "B-";
  if(p>=77)return "C+";if(p>=73)return "C";if(p>=70)return "C-";if(p>=67)return "D+";if(p>=63)return "D";if(p>=60)return "D-";return "F";
}
export function courseGradeSummary(scopeId:string,course:Course,grades:Grade[]) {
  const courseGrades=grades.filter((grade)=>grade.courseId===course.id);
  // Overall grades are distinct from assignment letter grades.
  const overall=[...courseGrades].reverse().find((grade)=>grade.letter&&["course grade","current course grade","overall course grade"].includes((grade.label??"").trim().toLowerCase()));
  const localLetter=overall?.letter?.toUpperCase();
  let canvasLetter: string|undefined;
  let canvasPercent: number|undefined;
  if(typeof window!=="undefined"){
    try{
      const data=JSON.parse(window.localStorage.getItem(courseGradeKey(scopeId,course))||"null") as Structure|null;
      if(data?.canvasLetter && GRADE_POINTS[data.canvasLetter]!==undefined)canvasLetter=data.canvasLetter;
      if(typeof data?.canvasPercent==="number" && Number.isFinite(data.canvasPercent))canvasPercent=data.canvasPercent;
    }catch{}
  }
  const letter=canvasLetter??(localLetter&&GRADE_POINTS[localLetter]!==undefined?localLetter:undefined);
  return {letter,percentage:canvasPercent,weightedEstimate:undefined,incomplete:false,source:canvasLetter?"Canvas-reported grade":localLetter?"recorded course grade":canvasPercent!==undefined?"Canvas PDF total":"ungraded"};
}
