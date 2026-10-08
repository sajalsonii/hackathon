export type Skill = {
  name: string;
  category: "Languages" | "Frontend" | "Backend" | "Tools";
  level: number;
  years: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  technologies: string[];
  github: string;
  demo: string;
  year: number;
  status: "Deployed" | "In development";
  features: string[];
};

export const portfolio = {
  personal: {
    name: "Alex Morgan",
    initials: "AM",
    title: "Software Engineer & Creative Developer",
    location: "San Francisco, CA",
    email: "alex.morgan@example.com",
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    resume: "/resume.pdf",
    university: "Northbridge University",
    graduationYear: 2026,
    intro:
      "I build thoughtful digital systems at the intersection of engineering, interaction, and visual storytelling.",
  },
  about: {
    eyebrow: "Operator profile",
    headline: "Turning complex problems into clear digital experiences.",
    paragraphs: [
      "I’m a computer science student and product-minded developer interested in the space between robust engineering and expressive design. I enjoy shaping ideas from their earliest sketches into accessible, production-ready products.",
      "My current focus is full-stack web development, human-computer interaction, and creative tooling. I’m seeking opportunities to learn from ambitious teams and contribute to products that make technology feel more intuitive.",
    ],
    principles: ["Build with empathy", "Learn in public", "Design for clarity"],
  },
  education: [
    {
      id: "uni",
      period: "2022 — 2026",
      degree: "B.S. Computer Science",
      university: "Northbridge University",
      description:
        "Concentration in human-computer interaction with a minor in digital media.",
      coursework: [
        "Data Structures",
        "Software Engineering",
        "Computer Graphics",
        "Machine Learning",
      ],
      achievements: ["Dean’s List · 2023–25", "Innovation Grant Recipient"],
    },
    {
      id: "cert",
      period: "2024",
      degree: "Cloud Developer Certification",
      university: "Open Cloud Institute",
      description:
        "Applied cloud architecture, container workflows, and reliable deployment patterns.",
      coursework: ["Cloud Architecture", "Docker", "CI/CD"],
      achievements: ["Completed with distinction"],
    },
    {
      id: "lab",
      period: "2025",
      degree: "HCI Research Fellowship",
      university: "Interface Futures Lab",
      description:
        "Exploring adaptive interfaces and accessible interaction models for emerging platforms.",
      coursework: ["User Research", "Prototyping", "Accessibility"],
      achievements: ["Student Research Showcase"],
    },
  ],
  skills: [
    { name: "TypeScript", category: "Languages", level: 92, years: 3 },
    { name: "JavaScript", category: "Languages", level: 90, years: 4 },
    { name: "Python", category: "Languages", level: 82, years: 3 },
    { name: "Java", category: "Languages", level: 74, years: 2 },
    { name: "React", category: "Frontend", level: 90, years: 3 },
    { name: "Next.js", category: "Frontend", level: 84, years: 2 },
    { name: "Tailwind CSS", category: "Frontend", level: 88, years: 3 },
    { name: "Node.js", category: "Backend", level: 82, years: 3 },
    { name: "REST APIs", category: "Backend", level: 86, years: 3 },
    { name: "PostgreSQL", category: "Backend", level: 76, years: 2 },
    { name: "Git & GitHub", category: "Tools", level: 90, years: 4 },
    { name: "Docker", category: "Tools", level: 72, years: 2 },
  ] satisfies Skill[],
  projects: [
    {
      id: "01",
      name: "Signal Atlas",
      description:
        "A collaborative intelligence workspace for turning research into connected, visual knowledge.",
      longDescription:
        "Signal Atlas combines a spatial canvas, semantic search, and real-time collaboration to help small research teams see relationships hidden across their source material.",
      technologies: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      github: "https://github.com/",
      demo: "https://example.com/",
      year: 2025,
      status: "Deployed",
      features: ["Live collaborative canvas", "Semantic linking", "Version history"],
    },
    {
      id: "02",
      name: "Orbit Finance",
      description:
        "A calm, accessible financial dashboard that makes long-term goals feel tangible.",
      longDescription:
        "A responsive personal finance experience with goal forecasting, plain-language insights, and privacy-first local data controls.",
      technologies: ["Next.js", "D3", "Tailwind", "Supabase"],
      github: "https://github.com/",
      demo: "https://example.com/",
      year: 2024,
      status: "Deployed",
      features: ["Goal simulations", "Accessible charts", "Smart categorization"],
    },
    {
      id: "03",
      name: "Aether Console",
      description:
        "An open-source monitoring interface for distributed services and edge deployments.",
      longDescription:
        "A realtime systems dashboard designed around legibility under pressure, with event correlation and configurable incident views.",
      technologies: ["React", "WebSockets", "Express", "Docker"],
      github: "https://github.com/",
      demo: "https://example.com/",
      year: 2026,
      status: "In development",
      features: ["Live telemetry", "Incident timelines", "Custom alert rules"],
    },
  ] satisfies Project[],
  experience: [
    {
      year: "2022",
      type: "ORIGIN",
      title: "Computer Science, Northbridge",
      text: "Began exploring the fundamentals of software and interaction design.",
    },
    {
      year: "2023",
      type: "BUILD",
      title: "Frontend Engineering Intern",
      text: "Shipped accessible product experiences within a cross-functional team.",
    },
    {
      year: "2024",
      type: "EXPAND",
      title: "Open-source Contributor",
      text: "Contributed interface improvements and documentation to developer tools.",
    },
    {
      year: "2025",
      type: "DISCOVER",
      title: "HCI Research Fellow",
      text: "Studying adaptive systems and more inclusive interaction patterns.",
    },
  ],
};

export const navItems = [
  "home",
  "about",
  "education",
  "skills",
  "projects",
  "experience",
  "contact",
];
