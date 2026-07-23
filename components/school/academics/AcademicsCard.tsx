"use client";

import { buildAcademics } from "./academicHelpers";
import AcademicHeader from "./AcademicHeader";
import AcademicOverview from "./AcademicOverview";
import CourseCard from "./CourseCard";
import { AcademicsData } from "./academicTypes";

interface AcademicsCardProps {
  data: AcademicsData;
}

export default function AcademicsCard({
  data,
}: AcademicsCardProps) {
  const academics = buildAcademics(data);

  return (
    <div className="space-y-8">
      {/* Header */}

      <AcademicHeader
        academics={academics}
      />

      {/* Semester Overview */}

      <AcademicOverview
        data={data}
      />

      {/* Courses */}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Courses
            </h2>

            <p className="mt-1 text-white/55">
              Your active courses ranked by current performance.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/65">
            {academics.courses.length}{" "}
            {academics.courses.length === 1
              ? "Course"
              : "Courses"}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {academics.courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}