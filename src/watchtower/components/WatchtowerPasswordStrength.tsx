import { Check, X } from "lucide-react";

export type PasswordStrength = { score: number; label: string; color: string };

export function evaluatePassword(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score: 1, label: "FRACA", color: "bg-destructive" };
  if (score <= 3) return { score: 2, label: "MÉDIA", color: "bg-yellow-500" };
  return { score: 3, label: "FORTE", color: "bg-green-500" };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = evaluatePassword(password);
  const ariaText = s.score === 0 ? "Senha muito fraca" : s.score === 1 ? "Senha fraca" : s.score === 2 ? "Senha média" : "Senha forte";
  return (
    <div className="space-y-1.5 pt-1" aria-live="polite" aria-atomic="true">
      <div className="flex gap-1" role="img" aria-label={`Força da senha: ${ariaText}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= s.score ? s.color : "bg-muted"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-[10px] tracking-wider text-muted-foreground">
        FORÇA: <span className="text-foreground">{s.label}</span>
      </p>
      <span className="sr-only">{ariaText}</span>
    </div>
  );
}

type Rule = { label: string; test: (pw: string) => boolean };

const RULES: Rule[] = [
  { label: "Mínimo de 6 caracteres", test: (pw) => pw.length >= 6 },
  { label: "Recomendado: 10+ caracteres", test: (pw) => pw.length >= 10 },
  { label: "Letras maiúsculas e minúsculas", test: (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
  { label: "Pelo menos um número", test: (pw) => /\d/.test(pw) },
  { label: "Símbolo (!@#$%...) — opcional", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function PasswordRulesHint({ password }: { password: string }) {
  const passedCount = RULES.filter((r) => r.test(password)).length;
  const totalCount = RULES.length;
  const ariaText = passedCount === totalCount 
    ? "Todas as regras de senha foram atendidas" 
    : `${passedCount} de ${totalCount} regras atendidas. Regras pendentes: ${RULES.filter((r) => !r.test(password)).map((r) => r.label).join(", ")}`;

  return (
    <div 
      className="rounded-md border border-border bg-secondary/40 p-3 space-y-1.5" 
      aria-live="polite" 
      aria-atomic="true"
    >
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-semibold">
        REGRAS DA SENHA
      </p>
      <ul className="space-y-1" role="list" aria-label={`Progresso das regras: ${passedCount} de ${totalCount} atendidas`}>
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li
              key={r.label}
              className={`flex items-center gap-2 text-[11px] transition-colors ${
                ok ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {ok ? (
                <Check className="h-3 w-3 text-green-500 shrink-0" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-hidden="true" />
              )}
              <span>{r.label}</span>
              <span className="sr-only">{ok ? " - atendida" : " - pendente"}</span>
            </li>
          );
        })}
      </ul>
      <span className="sr-only">{ariaText}</span>
    </div>
  );
}
