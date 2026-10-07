import { FormEvent, useState } from "react";
import { api } from "../api";

export function Login() {
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(creating ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });
      window.location.assign("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in");
    }
  }

  return (
    <main className="login card">
      <h1>VeloPortal</h1>
      <p>Sign in with your Gmail address, or a username, to keep a training profile and choose the ride the bike will follow.</p>
      <form onSubmit={submit}>
        {creating ? (
          <label>
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        ) : null}
        <label>
          <span>Gmail address or username</span>
          <input type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" autoComplete={creating ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
        </label>
        <button type="submit">{creating ? "Create account" : "Sign in"}</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <p>
        <button className="quiet" type="button" onClick={() => { setCreating(!creating); setError(""); }}>
          {creating ? "I already have an account" : "Create an account"}
        </button>
      </p>
    </main>
  );
}
