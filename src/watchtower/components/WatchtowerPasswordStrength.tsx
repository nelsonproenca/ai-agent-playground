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
