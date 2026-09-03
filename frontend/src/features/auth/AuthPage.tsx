import { type FormEvent, useState } from "react";
import { useAuth } from "./AuthContext";

export function AuthPage() {
  const { configured, signIn, signUp } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent, mode: "signIn" | "signUp") => {
    event.preventDefault(); setBusy(true); setMessage(null);
    const result = await (mode === "signIn" ? signIn(email, password) : signUp(email, password));
    setBusy(false); setMessage(result ?? (mode === "signUp" ? "Check your inbox to confirm your account." : null));
  };
  return <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5"><form className="card w-full space-y-4" onSubmit={(event) => void submit(event, "signIn")}><h1 className="text-2xl font-black">Resilience</h1><p className="text-sm text-slate-600">Your financial information is private to your account.</p>{!configured && <p role="alert" className="text-rose-700">Authentication is not configured. Set the public Supabase environment values.</p>}<label className="block">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="block">Password<input required minLength={12} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{message && <p role="status">{message}</p>}<button className="button-primary w-full" disabled={!configured || busy} type="submit">Sign in</button><button className="button-secondary w-full" disabled={!configured || busy} onClick={(event) => void submit(event, "signUp")} type="button">Create account</button></form></main>;
}
