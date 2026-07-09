"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-02",
  "2026-05-05",
  "2026-05-25",
  "2026-06-03",
  "2026-07-17",
  "2026-08-17",
  "2026-09-24",
  "2026-09-25",
  "2026-10-05",
  "2026-10-09",
  "2026-12-25",
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultWorkdays(year: number): number {
  const holidaySet = new Set(year === 2026 ? HOLIDAYS_2026 : []);
  let count = 0;
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const day = d.getDay();
    if (day !== 0 && day !== 6 && !holidaySet.has(toISODate(d))) {
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function formatWithCommas(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("ko-KR");
}

function fmtWon(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString("ko-KR");
}

const RATE_INTERVALS: { label: string; seconds: number }[] = [
  { label: "1초", seconds: 1 },
  { label: "1분", seconds: 60 },
  { label: "15분", seconds: 900 },
  { label: "30분", seconds: 1800 },
  { label: "45분", seconds: 2700 },
  { label: "1시간", seconds: 3600 },
];

export default function SalaryMeter() {
  const currentYear = new Date().getFullYear();

  const [salaryDigits, setSalaryDigits] = useState("");
  const [workdays, setWorkdays] = useState(() => String(getDefaultWorkdays(currentYear)));
  const [hours, setHours] = useState("8");
  const [view, setView] = useState<"form" | "result">("form");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (view !== "result") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [view]);

  const salary = Number(salaryDigits || "0");
  const workdaysNum = Math.max(1, Number(workdays || "0"));
  const hoursNum = Math.max(0.1, Number(hours || "0"));

  const perSecond = salary / (workdaysNum * hoursNum * 3600);

  const earned = useMemo(() => {
    if (!startTime) return 0;
    const elapsedSec = (now - startTime) / 1000;
    return Math.max(0, elapsedSec) * perSecond;
  }, [now, startTime, perSecond]);

  const handleSalaryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setSalaryDigits(digits);
  };

  const handleConfirm = () => {
    if (!salaryDigits || salary <= 0) return;
    setStartTime(Date.now());
    setNow(Date.now());
    setView("result");
  };

  const handleBack = () => {
    setView("form");
    setStartTime(null);
  };

  if (view === "result") {
    return (
      <div className="w-full max-w-[420px] mx-auto min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="text-[13px] text-neutral-400 mb-3 tracking-wide">지금까지</div>
        <div className="font-mono font-bold text-[clamp(32px,9vw,52px)] text-neutral-900 tabular-nums mb-2 text-center">
          {fmtWon(earned)}원
        </div>
        <div className="text-[15px] text-neutral-500 mb-8">벌었습니다</div>

        <div className="w-full border border-neutral-200 rounded-xl overflow-hidden mb-8">
          {RATE_INTERVALS.map((r, i) => (
            <div
              key={r.label}
              className={`flex items-center justify-between px-4 py-3 text-[14px] ${
                i !== RATE_INTERVALS.length - 1 ? "border-b border-neutral-200" : ""
              }`}
            >
              <span className="text-neutral-500">{r.label}당</span>
              <span className="font-mono font-medium text-neutral-900 tabular-nums">
                {fmtWon(perSecond * r.seconds)}원
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleBack}
          className="text-[13px] text-neutral-400 underline underline-offset-4 hover:text-neutral-600"
        >
          다시 입력하기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[380px] mx-auto min-h-screen flex flex-col justify-center px-6">
      <h1 className="text-[19px] font-bold text-neutral-900 mb-8 text-center">급여 미터기</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] text-neutral-500 mb-1.5">연봉 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatWithCommas(salaryDigits)}
            onChange={handleSalaryChange}
            placeholder="50,000,000"
            className="w-full border border-neutral-300 text-neutral-900 text-[16px] px-3 py-2.5 rounded-lg outline-none focus:border-neutral-900 text-right font-mono"
          />
        </div>

        <div>
          <label className="block text-[13px] text-neutral-500 mb-1.5">
            연간 근무일수 <span className="text-neutral-400">(주말·공휴일 제외 자동 계산됨)</span>
          </label>
          <input
            type="number"
            value={workdays}
            onChange={(e) => setWorkdays(e.target.value)}
            className="w-full border border-neutral-300 text-neutral-900 text-[16px] px-3 py-2.5 rounded-lg outline-none focus:border-neutral-900 text-right font-mono"
          />
        </div>

        <div>
          <label className="block text-[13px] text-neutral-500 mb-1.5">하루 근무시간</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full border border-neutral-300 text-neutral-900 text-[16px] px-3 py-2.5 rounded-lg outline-none focus:border-neutral-900 text-right font-mono"
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!salaryDigits || salary <= 0}
          className="w-full bg-neutral-900 text-white text-[15px] font-medium py-3 rounded-lg mt-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>
    </div>
  );
}