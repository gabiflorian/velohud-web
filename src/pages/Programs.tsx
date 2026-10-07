import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Program, api } from "../api";

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState("");

  function load() {
    api<Program[]>("/programs").then(setPrograms);
  }

  useEffect(load, []);

  async function generate() {
    setError("");
    try {
      await api<Program[]>("/programs/generate", { method: "POST" });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate");
    }
  }

  async function makeCurrent(id: number) {
    await api(`/programs/${id}/current`, { method: "POST" });
    load();
  }

  return (
    <>
      <div className="card">
        <h1>Programs</h1>
        <p>Generate a week from the profile. Each session is your copy. Editing it does not change the rules that built it. One session is the current ride.</p>
        <button onClick={generate}>Generate a week</button>
        {error ? <p className="error">{error}</p> : null}
      </div>
      {programs.map((program) => (
        <article className="card" key={program.id}>
          <h2>
            {program.name}
            {program.is_current ? <span className="current">Current ride</span> : null}
          </h2>
          <p>{program.steps.length} steps</p>
          <div className="row">
            <Link to={`/programs/${program.id}`}>Edit</Link>
            <button className="quiet" disabled={program.is_current} onClick={() => makeCurrent(program.id)}>
              Use for the next ride
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
