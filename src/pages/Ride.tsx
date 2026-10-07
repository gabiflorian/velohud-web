import { useEffect, useState } from "react";
import { api } from "../api";

type LiveRide = {
  active: boolean;
  program?: string | null;
  hr?: number | null;
  cadence?: number | null;
  power?: number | null;
  target_hr?: number | null;
  target_cadence?: number | null;
  target_power?: number | null;
};

export function Ride() {
  const [ride, setRide] = useState<LiveRide | null>(null);

  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const next = await api<LiveRide>("/rides/current");
        if (!stopped) setRide(next);
      } catch {
        if (!stopped) setRide({ active: false });
      }
    }
    load();
    const timer = window.setInterval(load, 1000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!ride) return <p>Loading…</p>;
  if (!ride.active) {
    return (
      <div className="card">
        <h1>Ride</h1>
        <p>No ride is coming in from the bike.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Ride</h1>
      <p>{ride.program || "Current session"}</p>
      <div className="metrics">
        <Metric label="Heart rate" value={ride.hr} target={ride.target_hr} unit="bpm" />
        <Metric label="Cadence" value={ride.cadence} target={ride.target_cadence} unit="rpm" />
        <Metric label="Power" value={ride.power} target={ride.target_power} unit="W" />
      </div>
    </div>
  );
}

function Metric({ label, value, target, unit }: { label: string; value?: number | null; target?: number | null; unit: string }) {
  return (
    <div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? "—"}</div>
      <div className="metric-target">{target != null ? `target ${target} ${unit}` : unit}</div>
    </div>
  );
}
