import { FormEvent, useEffect, useState } from "react";
import { Bike, api } from "../api";

export function Bikes() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    api<Bike[]>("/bikes").then(setBikes);
  }

  useEffect(load, []);

  async function claim(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/pair/claim", { method: "POST", body: JSON.stringify({ user_code: code }) });
      setCode("");
      setMessage("That bike is now on this profile. The code on the TV should disappear.");
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add the bike");
    }
  }

  async function remove(id: number) {
    await api(`/bikes/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <form className="card" onSubmit={claim}>
        <h1>Bike</h1>
        <p>The TV shows a short code when the Pi is waiting. Type that code here while you are signed in. It attaches the bike to this profile. The code expires in a few minutes and works once.</p>
        <label>
          <span>Code from the TV</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} autoCapitalize="characters" />
        </label>
        <button type="submit">Add this bike</button>
        {message ? <p>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
      {bikes.map((bike) => (
        <article className="card" key={bike.id}>
          <h2>{bike.name}</h2>
          <button className="quiet" onClick={() => remove(bike.id)}>Remove</button>
        </article>
      ))}
    </>
  );
}
