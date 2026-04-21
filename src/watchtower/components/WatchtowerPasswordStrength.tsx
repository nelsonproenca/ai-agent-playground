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
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= s.score ? s.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] tracking-wider text-muted-foreground">
        FORÇA: <span className="text-foreground">{s.label}</span>
      </p>
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
  return (
    <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-1.5">
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-semibold">
        REGRAS DA SENHA
      </p>
      <ul className="space-y-1">
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
                <Check className="h-3 w-3 text-green-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              )}
              <span>{r.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
