import { Globe, Award, Code2, Cloud } from "lucide-react";

const technologies = [
  { name: ".Net Core (v3.1)", icon: Code2 },
  { name: "Entity Framework Core", icon: Code2 },
  { name: "Azure DevOps (CI/CD)", icon: Cloud },
  { name: "Azure Portal (Service Bus, Functions)", icon: Cloud },
];

const methodologies = ["TDD", "SCRUM Completo"];

const InternationalSection = () => {
  return (
    <section className="mt-16 max-w-4xl mx-auto">
      <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8 md:p-10 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground font-mono">
              Experiência Global em{" "}
              <span className="text-primary">Engenharia de Software</span>
            </h2>
          </div>

          {/* Quote */}
          <p className="text-muted-foreground border-l-2 border-primary/40 pl-4 italic">
            Com uma trajetória que ultrapassa fronteiras, trago para o Brasil o padrão de qualidade
            europeu em desenvolvimento de software e arquitetura Cloud.
          </p>

          {/* Company highlight */}
          <div className="rounded-lg border border-border bg-secondary/40 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="font-mono font-semibold text-foreground text-sm">
                Bee Engineering — Lisboa, Portugal
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Atuação no projeto <span className="font-semibold text-foreground">Galaxy (WhiteStar)</span>,
              aplicando engenharia de software sênior com padrões europeus de excelência.
            </p>
          </div>

          {/* Technologies */}
          <div className="space-y-3">
            <h4 className="font-mono text-sm text-muted-foreground">{"// tecnologias sêniores"}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {technologies.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
                >
                  <tech.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-mono text-foreground">{tech.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Methodologies */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-mono">{"// metodologias →"}</span>
            {methodologies.map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InternationalSection;
