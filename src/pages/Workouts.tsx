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
        <p>The solid line is the reading and the dotted line is the target. Heart rate, cadence, and power each have their own scale, in real units. The newest ride is first.</p>
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
  const padR = 110;
  const padT = 68;
  const padB = 44;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  function axis(item: (typeof series)[number]) {
    const values = points.flatMap((point) => {
      const target = point[item.target];
      return target && target > 0 ? [point[item.key], target] : [point[item.key]];
    });
    const max = Math.max(...values, 1);
    const step = max <= 40 ? 10 : max <= 100 ? 20 : max <= 250 ? 50 : 100;
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks: number[] = [];
    for (let tick = 0; tick <= top; tick += step) ticks.push(tick);
    return { top, ticks };
  }
  const axes = {
    hr: axis(series[0]),
    cadence: axis(series[1]),
    power: axis(series[2]),
  };
  const start = points[0].t;
  const span = Math.max(points[points.length - 1].t - start, 1);
  const minutes = span / 60000;
  const xTicks = Array.from({ length: 5 }, (_, index) => index / 4);

  function xOf(t: number) {
    return padL + ((t - start) / span) * plotW;
  }
  function yOf(value: number, top: number) {
    return padT + (1 - value / top) * plotH;
  }
  function line(key: "hr" | "cadence" | "power", targetKey: "target_hr" | "target_cadence" | "target_power", useTarget: boolean) {
    const top = axes[key].top;
    return points
      .map((point, index) => {
        const value = useTarget ? point[targetKey] : point[key];
        if (useTarget && (!value || value <= 0)) return "";
        const x = xOf(point.t);
        const y = yOf(value || 0, top);
        const command = index === 0 || (useTarget && (!points[index - 1][targetKey] || points[index - 1][targetKey]! <= 0)) ? "M" : "L";
        return `${command}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
        {axes.hr.ticks.map((tick) => (
          <g key={`hr-${tick}`}>
            <line x1={padL} x2={width - padR} y1={yOf(tick, axes.hr.top)} y2={yOf(tick, axes.hr.top)} stroke="#e2d9c8" />
            <text x={padL - 8} y={yOf(tick, axes.hr.top) + 5} textAnchor="end" fontSize="16" fill="#c23b2e">
              {tick}
            </text>
          </g>
        ))}
        {axes.cadence.ticks.map((tick) => (
          <text key={`cadence-${tick}`} x={width - padR + 8} y={yOf(tick, axes.cadence.top) + 5} textAnchor="start" fontSize="16" fill="#1d7a8c">
            {tick}
          </text>
        ))}
        {axes.power.ticks.map((tick) => (
          <text key={`power-${tick}`} x={width - 4} y={yOf(tick, axes.power.top) + 5} textAnchor="end" fontSize="16" fill="#c47b12">
            {tick}
          </text>
        ))}
        {xTicks.map((tick) => (
          <text key={tick} x={padL + tick * plotW} y={height - 12} textAnchor="middle" className="axis">
            {Math.round(tick * minutes)} min
          </text>
        ))}
        <line x1={padL} x2={padL} y1={padT} y2={padT + plotH} stroke="#1c1915" />
        <line x1={padL} x2={width - padR} y1={padT + plotH} y2={padT + plotH} stroke="#1c1915" />
        {series.map((item) => (
          <path key={`${item.key}-target`} d={line(item.key, item.target, true)} fill="none" stroke={item.color} strokeWidth="2" strokeDasharray="8 6" />
        ))}
        {series.map((item) => (
          <path key={item.key} d={line(item.key, item.target, false)} fill="none" stroke={item.color} strokeWidth="3" />
        ))}
        {series.map((item, index) => (
          <text key={item.key} x={padL} y={16 + index * 16} fontSize="16" fill={item.color}>
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
