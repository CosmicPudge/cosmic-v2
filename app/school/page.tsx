import DashboardGrid from "@/components/school/layout/DashboardGrid";
import DashboardItem from "@/components/school/layout/DashboardItem";
import SchoolDashboard from "@/components/school/layout/SchoolDashboard";
import SchoolHero from "@/components/school/hero/SchoolHero"
import {heroData} from "@/lib/school/mock/hero"


function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white">
      {title}
    </div>
  );
}

export default function SchoolPage() {
  return (
    <SchoolDashboard>
      <DashboardGrid>
        <DashboardItem span={{ lg: 12 }}>
          <SchoolHero data={heroData} />
        </DashboardItem>

        <DashboardItem span={{ lg: 5 }}>
          <Placeholder title="Focus" />
        </DashboardItem>

        <DashboardItem span={{ lg: 7 }}>
          <Placeholder title="Timeline" />
        </DashboardItem>

        <DashboardItem span={{ lg: 4 }}>
          <Placeholder title="Academics" />
        </DashboardItem>

        <DashboardItem span={{ lg: 4 }}>
          <Placeholder title="AFROTC" />
        </DashboardItem>

        <DashboardItem span={{ lg: 4 }}>
          <Placeholder title="Deadlines" />
        </DashboardItem>

        <DashboardItem span={{ lg: 8 }}>
          <Placeholder title="AI Coach" />
        </DashboardItem>

        <DashboardItem span={{ lg: 4 }}>
          <Placeholder title="Quick Actions" />
        </DashboardItem>
      </DashboardGrid>
    </SchoolDashboard>
  );
}