import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Program, Step, api } from "../api";

export function ProgramEdit() {
  const { id } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Program>(`/programs/${id}`).then(setProgram);
  }, [id]);

  if (!program) return <p>Loading…</p>;

  function updateStep(index: number, patch: Partial<Step>) {
    setProgram({
      ...program!,
      steps: program!.steps.map((step, position) => (position === index ? { ...step, ...patch } : step)),
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const saved = await api<Program>(`/programs/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: program!.name, steps: program!.steps }),
      });
      setProgram(saved);
      setMessage("Saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save");
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <h1>Edit session</h1>
      <label>
        <span>Name</span>
        <input value={program.name} onChange={(event) => setProgram({ ...program, name: event.target.value })} />
      </label>
      <table>
        <thead>
          <tr>
            <th>Seconds</th>
            <th>Heart rate</th>
            <th>Cadence</th>
            <th>Power</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {program.steps.map((step, index) => (
            <tr key={index}>
              <td><input type="number" value={step.duration_s} onChange={(event) => updateStep(index, { duration_s: Number(event.target.value) })} /></td>
              <td><input type="number" value={step.target_hr ?? ""} onChange={(event) => updateStep(index, { target_hr: optionalNumber(event.target.value) })} /></td>
              <td><input type="number" value={step.target_cadence ?? ""} onChange={(event) => updateStep(index, { target_cadence: optionalNumber(event.target.value) })} /></td>
              <td><input type="number" value={step.target_power ?? ""} onChange={(event) => updateStep(index, { target_power: optionalNumber(event.target.value) })} /></td>
              <td>
                <button type="button" className="quiet" onClick={() => setProgram({ ...program, steps: program.steps.filter((_, position) => position !== index) })}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row">
        <button type="button" className="quiet" onClick={() => setProgram({ ...program, steps: [...program.steps, { duration_s: 300, target_hr: 120, target_cadence: 85, target_power: null }] })}>
          Add step
        </button>
        <button type="submit">Save session</button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}

function optionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  return Number(value);
}
