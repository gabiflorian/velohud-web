import { FormEvent, useEffect, useState } from "react";
import { Profile, api } from "../api";

const empty: Profile = {
  birth_date: null,
  sex: "unspecified",
  weight_kg: null,
  resting_hr: null,
  max_hr: null,
  threshold_power: null,
  days_per_week: 3,
  experience: "regular",
};

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Profile>("/profile").then(setProfile);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const saved = await api<Profile>("/profile", { method: "PUT", body: JSON.stringify(profile) });
      setProfile(saved);
      setMessage("Saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save");
    }
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile({ ...profile, [key]: value });
  }

  return (
    <form className="card" onSubmit={save}>
      <h1>Profile</h1>
      <p>Date of birth is what the week of sessions is built from. Leave max heart rate empty to use an estimate. Power targets appear only when a threshold power is set.</p>
      <label>
        <span>Date of birth</span>
        <input type="date" value={profile.birth_date ?? ""} onChange={(event) => set("birth_date", event.target.value || null)} />
      </label>
      <label>
        <span>Sex</span>
        <select value={profile.sex} onChange={(event) => set("sex", event.target.value as Profile["sex"])}>
          <option value="unspecified">Unspecified</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </label>
      <div className="row">
        <label>
          <span>Weight, kg</span>
          <input type="number" value={profile.weight_kg ?? ""} onChange={(event) => set("weight_kg", numberOrNull(event.target.value))} />
        </label>
        <label>
          <span>Resting heart rate</span>
          <input type="number" value={profile.resting_hr ?? ""} onChange={(event) => set("resting_hr", numberOrNull(event.target.value))} />
        </label>
        <label>
          <span>Max heart rate</span>
          <input type="number" value={profile.max_hr ?? ""} onChange={(event) => set("max_hr", numberOrNull(event.target.value))} />
        </label>
        <label>
          <span>Threshold power, W</span>
          <input type="number" value={profile.threshold_power ?? ""} onChange={(event) => set("threshold_power", numberOrNull(event.target.value))} />
        </label>
        <label>
          <span>Days per week</span>
          <input type="number" value={profile.days_per_week ?? 3} onChange={(event) => set("days_per_week", numberOrNull(event.target.value))} />
        </label>
        <label>
          <span>Experience</span>
          <select value={profile.experience} onChange={(event) => set("experience", event.target.value as Profile["experience"])}>
            <option value="beginner">Beginner</option>
            <option value="regular">Regular</option>
            <option value="experienced">Experienced</option>
          </select>
        </label>
      </div>
      <button type="submit">Save profile</button>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
