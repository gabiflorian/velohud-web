import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiError, API, Person, User, api } from "./api";
import { Bikes } from "./pages/Bikes";
import { Login } from "./pages/Login";
import { People } from "./pages/People";
import { ProfilePage } from "./pages/Profile";
import { ProgramEdit } from "./pages/ProgramEdit";
import { Programs } from "./pages/Programs";
import { Ride } from "./pages/Ride";
import { Workouts } from "./pages/Workouts";

export function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) setUser(null);
        else setUser(null);
      });
  }, []);

  if (user === undefined) return <main>Loading…</main>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="*" element={user ? <Shell user={user} onSignOut={() => setUser(null)} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function Shell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const navigate = useNavigate();

  async function signOut() {
    await api("/auth/logout", { method: "POST" });
    onSignOut();
    navigate("/login");
  }

  return (
    <>
      <header>
        <Link to="/">VeloPortal</Link>
        <nav>
          <Link to="/ride">Ride</Link>
          <Link to="/workouts">Workouts</Link>
          <RiderSelect />
          <Link to="/people">People</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/programs">Programs</Link>
          <Link to="/bikes">Bike</Link>
          <span>{user.email}</span>
          <button className="quiet" onClick={signOut}>Sign out</button>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/ride" replace />} />
          <Route path="/ride" element={<Ride />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/people" element={<People />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramEdit />} />
          <Route path="/bikes" element={<Bikes />} />
        </Routes>
      </main>
    </>
  );
}

function RiderSelect() {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const next = await api<Person[]>("/persons");
        if (!stopped) setPeople(next);
      } catch {
        if (!stopped) setPeople([]);
      }
    }
    load();
    window.addEventListener("velo-people", load);
    return () => {
      stopped = true;
      window.removeEventListener("velo-people", load);
    };
  }, []);

  const selected = people.find((person) => person.selected)?.id ?? "";
  if (people.length === 0) return null;

  return (
    <select
      aria-label="Rider"
      value={selected}
      onChange={(event) => {
        api<Person[]>(`/persons/${event.target.value}/select`, { method: "POST" }).then((next) => {
          setPeople(next);
          window.dispatchEvent(new Event("velo-people"));
        });
      }}
    >
      {people.map((person) => (
        <option key={person.id} value={person.id}>{person.name}</option>
      ))}
    </select>
  );
}

export { API };
