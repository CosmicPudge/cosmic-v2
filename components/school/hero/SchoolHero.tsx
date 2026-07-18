"use client";

import AmbientBackground from "./AmbientBackground";
import HeroHeader from "./HeroHeader";
import MissionPanel from "./MissionPanel";
import AtAGlance from "./AtAGlance";
import SemesterProgress from "./SemesterProgress";
import { motion } from "framer-motion";
import type { SchoolHeroData } from "@/lib/school/mock/hero";
import GlassPanel from "@/components/os/ui/GlassPanel";
import HeroTitle from "@/components/os/ui/HeroTitle";


interface SchoolHeroProps {
    data: SchoolHeroData;
}

export default function SchoolHero({ data }: SchoolHeroProps) {
    return (
        <motion.section
            initial={{
                opacity: 0,
                y: 24,
                scale: 0.985,
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
            }}
            transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            <GlassPanel
                variant="hero"
                className="
    relative
    min-h-[760px]
    overflow-hidden
  "
            >
                <AmbientBackground />

                <div className="relative z-10 p-12 lg:p-16 xl:p-20">
                    <div className="mx-auto flex max-w-6xl flex-col space-y-14">

                        <HeroTitle
                            eyebrow={getGreeting()}
                            title="Mission Control"
                            headline="You're on track today."
                            description="Finish your Physics Lab before 11:59 PM. Everything else is under control."
                        />


                        {/* HEADER */}
                        <HeroHeader location={data.location} />

                        <Divider />

                        {/* TODAY */}
                        <div>
                            <p className="mb-5 text-xl font-medium text-white/80">
                                One task remains before you're done today.
                            </p>

                            <MissionPanel
                                title={data.mission.title}
                                description={data.mission.description}
                                due="Due Tonight"
                                estimatedTime="Est. 1h 20m"
                                priority="High"
                            />
                        </div>

                        <Divider />

                        {/* QUICK STATS */}
                        <AtAGlance
                            classesToday={data.stats.classesToday}
                            assignmentsDue={data.stats.assignmentsDue}
                            afrotcEvents={data.stats.afrotcEvents}
                            gpa={data.stats.gpa}
                        />

                        <Divider />

                        {/* SEMESTER */}
                        <SemesterProgress
                            semester={data.semester}
                        />
                    </div>
                </div>
            </GlassPanel>
        </motion.section>
    );
}
function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}
function Divider() {
    return (
        <div
            className="
        h-px
        w-full
        bg-gradient-to-r
        from-transparent
        via-white/10
        to-transparent
      "
        />
    );
}