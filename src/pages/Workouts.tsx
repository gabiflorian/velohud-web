import { useEffect, useState } from "react";
import { api } from "../api";

type Workout = {
  id: number;
  program: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
};

type Point = {
  t: number;
  hr: number;
  cadence: number;
  power: number;
  target_hr?: number | null;
  target_cadence?: number | null;
  target_power?: number | null;
};

const series = [
  { key: "hr" as const, target: "target_hr" as const, label: "Heart rate", color: "#c23b2e" },
  { key: "cadence" as const, target: "target_cadence" as const, label: "Cadence", color: "#1d7a8c" },
  { key: "power" as const, target: "target_power" as const, label: "Power", color: "#c47b12" },
];

const PAGE = 10;

export function Workouts() {
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [charts, setCharts] = useState<Record<number, Point[]>>({});

  useEffect(() => {
    let stopped = false;
    async function load() {
      const body = await api<{ total: number; workouts: Workout[] }>(`/rides?offset=${page * PAGE}`);
      if (stopped) return;
      setTotal(body.total);
      setWorkouts(body.workouts);
      const next: Record<number, Point[]> = {};
      await Promise.all(
        body.workouts.map(async (workout) => {
          const samples = await api<{ samples: Point[] }>(`/rides/${workout.id}/samples`);
          next[workout.id] = samples.samples;
        }),
      );
      if (!stopped) setCharts(next);
    }
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <>
      <div className="card">
        <h1>Workouts</h1>
        <p>Each line is scaled to its own highest value, so heart rate, cadence, and power share one chart. The newest ride is first.</p>
        {total === 0 ? <p>No workouts yet.</p> : null}
        {total > PAGE ? (
          <div className="row">
            <button className="quiet" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</button>
            <span>{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
            <button className="quiet" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Older</button>
          </div>
        ) : null}
      </div>
      {workouts.map((workout) => (
        <div className="card" key={workout.id}>
          <h2>
            {startedTitle(workout.started_at)}
            {workout.active ? " · now" : ""}
          </h2>
          <p>{workout.program}</p>
          <Chart points={charts[workout.id] ?? []} />
        </div>
      ))}
    </>
  );
}

function startedTitle(iso: string) {
  const when = new Date(iso);
  const date = when.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const hour = when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${hour}`;
}

function Chart({ points }: { points: Point[] }) {
  if (points.length < 2) return <p>Not enough readings for a chart yet.</p>;
  const width = 1000;
  const height = 420;
  const padL = 72;
  const padR = 16;
  const padT = 68;
  const padB = 44;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const peak = {
    hr: Math.max(...points.map((point) => point.hr), 1),
    cadence: Math.max(...points.map((point) => point.cadence), 1),
    power: Math.max(...points.map((point) => point.power), 1),
  };
  function percent(point: Point, key: "hr" | "cadence" | "power", targetKey: "target_hr" | "target_cadence" | "target_power") {
    const target = point[targetKey];
    const base = target && target > 0 ? target : peak[key];
    return (point[key] / base) * 100;
  }
  const highest = Math.max(
    100,
    ...points.flatMap((point) => series.map((item) => percent(point, item.key, item.target))),
  );
  const yStep = highest > 200 ? 50 : 25;
  const yTop = Math.ceil(highest / yStep) * yStep;
  const yTicks: number[] = [];
  for (let tick = 0; tick <= yTop; tick += yStep) yTicks.push(tick);
  const start = points[0].t;
  const span = Math.max(points[points.length - 1].t - start, 1);
  const minutes = span / 60000;
  const xTicks = Array.from({ length: 5 }, (_, index) => index / 4);

  function xOf(t: number) {
    return padL + ((t - start) / span) * plotW;
  }
  function yOf(pct: number) {
    return padT + (1 - pct / yTop) * plotH;
  }
  function line(key: "hr" | "cadence" | "power", targetKey: "target_hr" | "target_cadence" | "target_power") {
    return points
      .map((point, index) => {
        const x = xOf(point.t);
        const y = yOf(percent(point, key, targetKey));
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL}
              x2={width - padR}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke={tick === 100 ? "#1c1915" : "#e2d9c8"}
              strokeDasharray={tick === 100 ? "6 4" : undefined}
            />
            <text x={padL - 8} y={yOf(tick) + 5} textAnchor="end" className="axis">
              {tick}%
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text key={tick} x={padL + tick * plotW} y={height - 12} textAnchor="middle" className="axis">
            {Math.round(tick * minutes)} min
          </text>
        ))}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke="#1c1915" />
        <line x1={padL} x2={width - padR} y1={padT + plotH} y2={padT + plotH} stroke="#1c1915" />
        {series.map((item) => (
          <path key={item.key} d={line(item.key, item.target)} fill="none" stroke={item.color} strokeWidth="3" />
        ))}
        {series.map((item, index) => (
          <text key={item.key} x={padL} y={16 + index * 16} fontSize="16" fill={item.color}>
            {item.label}, 100% is the target
          </text>
        ))}
      </svg>
    </div>
  );
}
