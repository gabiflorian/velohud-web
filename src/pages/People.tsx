import { useEffect, useState } from "react";
import { API, Person, api } from "../api";

export function People() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const next = await api<Person[]>("/persons");
    setPeople(next);
    window.dispatchEvent(new Event("velo-people"));
  }

  useEffect(() => {
    load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load people"));
  }, []);

  async function choose(id: number) {
    setError("");
    setPeople(await api<Person[]>(`/persons/${id}/select`, { method: "POST" }));
    window.dispatchEvent(new Event("velo-people"));
  }

  async function addPerson() {
    setError("");
    try {
      setPeople(await api<Person[]>("/persons", { method: "POST", body: JSON.stringify({ name }) }));
      setName("");
      window.dispatchEvent(new Event("velo-people"));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not add that person");
    }
  }

  async function upload(id: number, file: File | undefined) {
    if (!file) return;
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      setPeople(await api<Person[]>(`/persons/${id}/picture`, { method: "POST", body }));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save that picture");
    }
  }

  return (
    <div className="card">
      <h1>People</h1>
      <p>One account, several riders. The selected person is who the TV uses until someone picks another name there. A picture has to be a JPEG, PNG, or WebP under 400 KB.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="people">
        {people.map((person) => (
          <div key={person.id} className={person.selected ? "person selected" : "person"}>
            <button type="button" onClick={() => choose(person.id)}>
              <Portrait id={person.id} hasPicture={person.has_picture} />
              <span>{person.name}{person.selected ? " · selected" : ""}</span>
            </button>
            <label>
              <span>Picture</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => upload(person.id, event.target.files?.[0])}
              />
            </label>
          </div>
        ))}
      </div>
      <label>
        <span>Add a person</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="button" onClick={addPerson} disabled={name.trim() === ""}>Add</button>
    </div>
  );
}

function Portrait({ id, hasPicture }: { id: number; hasPicture: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPicture) {
      setUrl(null);
      return;
    }
    let objectUrl = "";
    let stopped = false;
    fetch(`${API}/persons/${id}/picture`, { credentials: "include" })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || stopped) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      stopped = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, hasPicture]);

  if (!url) return <div className="portrait" />;
  return <img className="portrait" src={url} alt="" />;
}
