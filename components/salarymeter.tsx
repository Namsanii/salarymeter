"use client";

import { useEffect, useMemo, useState } from "react";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

export default function SalaryMeter() {
  const [salaryStr, setSalaryStr] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const salary = useMemo(() => {
    const v = parseFloat(salaryStr);
    return isNaN(v) || v < 0 ? 0 : v;
  }, [salaryStr]);

  const perSec = salary / (365 * 24 * 3600);

  const earnedToday = useMemo(() => {
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const elapsedSec = (now.getTime() - midnight.getTime()) / 1000;
    return elapsedSec * perSec;
  }, [now, perSec]);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <h1 className="text-center text-[20px] font-bold mb-6 text-cream">급여 미터기</h1>

      <div className="rounded-2xl p-6 bg-housing border border-housing2">
        <input
          type="number"
          value={salaryStr}
          onChange={(e) => setSalaryStr(e.target.value)}
          placeholder="연봉을 입력하세요 (원)"
          min={0}
          className="w-full bg-bezel border border-[#33291a] text-cream font-mono text-[16px] px-3 py-3 rounded-lg outline-none focus:border-amber text-center"
        />

        <div className="mt-6 bg-bezel rounded-xl py-6 flex flex-col items-center gap-1">
          <div className="font-mono font-bold text-[clamp(28px,8vw,40px)] text-amber [text-shadow:0_0_12px_rgba(255,176,32,0.35)]">
            ₩{fmt(earnedToday)}
          </div>
          <div className="text-[11px] text-faint tracking-[0.1em]">오늘 누적 수입</div>
        </div>

        <div className="mt-4 text-center text-[13px] text-muted">
          초당 ₩{fmt(perSec)} 벌고 있어요
        </div>
      </div>
    </div>
  );
}