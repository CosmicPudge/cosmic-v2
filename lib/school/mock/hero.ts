export interface SchoolHeroData {
  greeting: string;
  subtitle: string;

  mission: {
    title: string;
    description: string;
  };

  semester: {
    name: string;
    week: number;
    progress: number;
  };

  stats: {
    classesToday: number;
    assignmentsDue: number;
    afrotcEvents: number;
    gpa: number;
  };

  location: string;
}

export const heroData: SchoolHeroData = {
  greeting: "Good Morning",
  subtitle: "Let's make today count.",

  mission: {
    title: "Today's Mission",
    description: "Finish your Physics Lab before lunch.",
  },

 semester: {
    name: "Fall 2026",
    week: 0,
    progress: 0,
},

  stats: {
    classesToday: 2,
    assignmentsDue: 1,
    afrotcEvents: 1,
    gpa: 3.84,
  },

  location: "Logan, Utah",
};