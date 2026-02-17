import { Briefcase, Cloud, Brain, Layers, Server, Smartphone } from "lucide-react";

const experiences = [
  {
    icon: Cloud,
    company: "Loonar",
    period: "01/2025 — Atual",
    role: "Analista Dev .NET Core Sr.",
    project: "Morpheus (Cloud SONDA)",
    techs: [".NET FW 4.8", "SQL Server 2022", "Azure", "AWS", "GCP", "OCI"],
    highlight: "Integração Multi-Cloud via Add-ins customizados.",
  },
  {
    icon: Layers,
    company: "RVC Advogados",
    period: "03/2022 — 05/2024",
    role: "Especialista de TI",
    project: "Intranet 4.0",
    techs: [".NET Core 3.1", "EF Core", "React.Js", "Azure Functions"],
    highlight: "Fullstack + CI/CD e infra Azure (Key Vaults).",
  },
  {
    icon: Smartphone,
    company: "Tivit",
    period: "08/2008 — 09/2016",
    role: "Analista Sr. & Mobile",
    project: "Intranet SAP",
    techs: ["Web APIs", "SQL Server", "Ionic", "iOS/Swift", "ETLs"],
    highlight: "Liderança técnica e apps híbridos/nativos.",
  },
];

const badges = [
  { icon: Server, label: "SOA Expert" },
  { icon: Cloud, label: "Cloud Architect" },
  { icon: Brain, label: "IA Integrator" },
];

const ProfessionalAuthority = () => {
  return (
    <section className="max-w-4xl mx-auto space-y-10">
      {/* Experience Grid */}
      <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-md p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground font-mono">
            Trajetória <span className="text-primary">Profissional</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {experiences.map((exp) => (
            <div
              key={exp.company}
              className="group relative rounded-xl border border-white/10 bg-card/60 backdrop-blur-md p-5 space-y-3 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <exp.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {exp.period}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-foreground text-base">
                  {exp.company}
                </h3>
                <p className="text-xs text-primary font-mono">{exp.role}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Projeto: {exp.project}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {exp.highlight}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {exp.techs.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialist Banner */}
      <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-md p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-foreground font-mono leading-tight">
            Arquiteto de Soluções{" "}
            <span className="text-primary">&</span> Líder Técnico
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Pós-graduado em Engenharia de Software com SOA, com mais de 15 anos
          liderando equipes de alto desempenho e entregando projetos críticos no
          Brasil e Europa.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary"
            >
              <badge.icon className="h-3 w-3" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalAuthority;
