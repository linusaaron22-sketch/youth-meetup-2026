"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fmtDateTime, one } from "@/lib/utils";

interface Participant {
  id: string;
  full_name: string;
  age: number | null;
  congregation: string | null;
  source: string;
  created_at: string;
  attendance: { checked_in_at: string } | { checked_in_at: string }[] | null;
}

export default function ParticipantAttendanceTable({ participants: initialParticipants, total: initialTotal }: { participants: Participant[]; total: number }) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState("");
  const [direction, setDirection] = useState<"before" | "after">("after");
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(initialTotal > 50);
  const [error, setError] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setError("");
        const params = new URLSearchParams({ page: String(page), q: search, direction });
        if (cursor) params.set("cursor", cursor);
        const response = await fetch(`/admin/participant-attendance?${params}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load participants.");
        setParticipants(result.participants);
        setTotal(result.total);
        setHasPrevious(result.hasPrevious);
        setHasNext(result.hasNext);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load participants.");
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, cursor, direction]);
  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <section className="card space-y-4" aria-labelledby="participant-attendance-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="participant-attendance-title" className="text-lg font-semibold text-forest-800">Participant Attendance</h2>
          <p className="mt-1 text-sm text-forest-600">{total} active participants</p>
        </div>
        <label className="w-full sm:max-w-sm">
          <span className="sr-only">Search participants by name</span>
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); setCursor(""); setDirection("after"); }}
            placeholder="Search by name"
            className="input"
          />
        </label>
      </div>

      <div className="space-y-3 md:hidden">
        {participants.map((participant) => {
          const checkedIn = one(participant.attendance);
          return (
            <Link
              key={participant.id}
              href={`/admin/participants/${participant.id}`}
              className="block rounded-xl border border-forest-100 bg-white p-4 transition hover:border-forest-300 hover:bg-forest-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-forest-800">{participant.full_name}</span>
                <span className={`badge shrink-0 ${checkedIn ? "bg-forest-100 text-forest-800" : "bg-ivory-100 text-forest-600"}`}>
                  {checkedIn ? "Present" : "Absent"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div><dt className="text-xs text-forest-500">Age</dt><dd>{participant.age ?? "—"}</dd></div>
                <div><dt className="text-xs text-forest-500">Congregation</dt><dd className="break-words">{participant.congregation || "—"}</dd></div>
                <div><dt className="text-xs text-forest-500">Check-in time</dt><dd>{checkedIn ? fmtDateTime(checkedIn.checked_in_at) : "—"}</dd></div>
                <div><dt className="text-xs text-forest-500">Registration source</dt><dd>{participant.source === "walk_in" ? "Walk-in" : "Online"}</dd></div>
              </dl>
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr>
              <th className="th">Full name</th>
              <th className="th">Age</th>
              <th className="th">Congregation</th>
              <th className="th">Attendance</th>
              <th className="th">Check-in time</th>
              <th className="th">Source</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const checkedIn = one(participant.attendance);
              return (
                <tr key={participant.id} className="border-t border-forest-100 hover:bg-forest-50/50">
                  <td className="td font-medium"><Link className="text-forest-800 underline-offset-2 hover:underline" href={`/admin/participants/${participant.id}`}>{participant.full_name}</Link></td>
                  <td className="td">{participant.age ?? "—"}</td>
                  <td className="td">{participant.congregation || "—"}</td>
                  <td className="td"><span className={`badge ${checkedIn ? "bg-forest-100 text-forest-800" : "bg-ivory-100 text-forest-600"}`}>{checkedIn ? "Present" : "Absent"}</span></td>
                  <td className="td">{checkedIn ? fmtDateTime(checkedIn.checked_in_at) : "—"}</td>
                  <td className="td">{participant.source === "walk_in" ? "Walk-in" : "Online"}</td>
                </tr>
              );
            })}
            {participants.length === 0 && <tr><td className="td text-forest-500" colSpan={6}>No participants match that name.</td></tr>}
          </tbody>
        </table>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {(hasPrevious || hasNext) && <div className="flex items-center justify-between text-sm">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const firstParticipant = participants[0];
            if (firstParticipant) { setCursor(`${firstParticipant.created_at}|${firstParticipant.id}`); setDirection("before"); setPage((value) => Math.max(1, value - 1)); }
          }} disabled={!hasPrevious}>Previous</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const lastParticipant = participants.at(-1);
            if (lastParticipant) { setCursor(`${lastParticipant.created_at}|${lastParticipant.id}`); setDirection("after"); setPage((value) => value + 1); }
          }} disabled={!hasNext}>Next</button>
        </div>
      </div>}
      {participants.length === 0 && total === 0 && <p className="text-sm text-forest-500">No participants registered yet.</p>}
    </section>
  );
}
