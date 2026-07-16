"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

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

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "계산 중";
  const s = Math.ceil(seconds);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return remS > 0 ? `${m}분 ${remS}초` : `${m}분`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return remM > 0 ? `${h}시간 ${remM}분` : `${h}시간`;
  const days = Math.floor(h / 24);
  const remH = h % 24;
  return remH > 0 ? `${days}일 ${remH}시간` : `${days}일`;
}

function diffHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diffMin = eh * 60 + em - (sh * 60 + sm);
  if (diffMin <= 0) diffMin = 8 * 60;
  return diffMin / 60;
}

function isWithinWorkWindow(
  now: Date,
  start: string,
  end: string,
  weekdaysOnly: boolean
): boolean {
  if (weekdaysOnly) {
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
  }
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startD = new Date(now);
  startD.setHours(sh, sm, 0, 0);
  const endD = new Date(now);
  endD.setHours(eh, em, 0, 0);
  if (endD <= startD) return false;
  return now >= startD && now < endD;
}

function getWorkStatus(
  now: Date,
  start: string,
  end: string,
  weekdaysOnly: boolean
): "working" | "before" | "after" | "weekend" {
  if (weekdaysOnly) {
    const day = now.getDay();
    if (day === 0 || day === 6) return "weekend";
  }
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startD = new Date(now);
  startD.setHours(sh, sm, 0, 0);
  const endD = new Date(now);
  endD.setHours(eh, em, 0, 0);
  if (now < startD) return "before";
  if (now >= endD) return "after";
  return "working";
}

const RATE_INTERVALS: { label: string; seconds: number }[] = [
  { label: "1분", seconds: 60 },
  { label: "10분", seconds: 600 },
  { label: "30분", seconds: 1800 },
];

const EMOJI_MAP: [string, string][] = [
  ["커피", "☕"],
  ["카페", "☕"],
  ["라떼", "☕"],
  ["피자", "🍕"],
  ["치킨", "🍗"],
  ["햄버거", "🍔"],
  ["목걸이", "💎"],
  ["반지", "💍"],
  ["귀걸이", "💎"],
  ["신발", "👟"],
  ["운동화", "👟"],
  ["가방", "👜"],
  ["여행", "✈️"],
  ["항공권", "✈️"],
  ["옷", "👕"],
  ["게임", "🎮"],
  ["책", "📚"],
  ["노트북", "💻"],
  ["컴퓨터", "💻"],
  ["폰", "📱"],
  ["휴대폰", "📱"],
  ["시계", "⌚"],
  ["케이크", "🎂"],
  ["맥주", "🍺"],
  ["와인", "🍷"],
  ["술", "🍶"],
  ["꽃", "💐"],
  ["향수", "🌸"],
  ["자동차", "🚗"],
  ["차", "☕"],
  ["김밥", "🍙"],
  ["짜장면", "🍜"],
  ["영화", "🎬"],
  ["지하철", "🚇"],
  ["버스", "🚌"],
  ["택시", "🚕"],
  ["라면", "🍜"],
  ["넷플릭스", "📺"],
  ["로또", "🍀"],
  ["빅맥", "🍔"],
  ["유튜브", "▶️"],
  ["멜론", "🎵"],
  ["iCloud", "☁️"],
];

function getEmoji(name: string): string {
  const found = EMOJI_MAP.find(([keyword]) => name.includes(keyword));
  return found ? found[1] : "🎁";
}

const SUGGESTED_GROUPS: { category: string; items: { name: string; price: number }[] }[] = [
  {
    category: "F&B",
    items: [
      { name: "아메리카노", price: 4500 },
      { name: "빅맥", price: 7900 },
      { name: "치킨", price: 20000 },
      { name: "짜장면", price: 7000 },
      { name: "삼각김밥", price: 1700 },
      { name: "라면", price: 4000 },
    ],
  },
  {
    category: "Subscription",
    items: [
      { name: "넷플릭스", price: 13500 },
      { name: "유튜브", price: 14900 },
      { name: "iCloud", price: 1100 },
    ],
  },
  {
    category: "Transportation",
    items: [
      { name: "지하철", price: 1550 },
      { name: "버스", price: 1500 },
      { name: "택시", price: 4800 },
    ],
  },
  {
    category: "etc",
    items: [
      { name: "영화표", price: 15000 },
      { name: "로또", price: 1000 },
    ],
  },
];
const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐️", "💛", "💫"];

interface WishItem {
  id: string;
  name: string;
  priceWon: number;
}

interface ConfettiParticle {
  id: number;
  emoji: string;
  tx: number;
  ty: number;
  rotate: number;
  delay: number;
}

function makeConfetti(): ConfettiParticle[] {
  return Array.from({ length: 28 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 180;
    return {
      id: i,
      emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 60,
      rotate: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.15,
    };
  });
}

interface CelebrationInfo {
  item: WishItem;
  count: number;
}

export default function SalaryMeter() {
  const currentYear = new Date().getFullYear();

  const [salaryManwonDigits, setSalaryManwonDigits] = useState("5000");
  const [workdays, setWorkdays] = useState(() => String(getDefaultWorkdays(currentYear)));
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [view, setView] = useState<"form" | "result">("form");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [earnedSec, setEarnedSec] = useState(0);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPriceDigits, setNewItemPriceDigits] = useState("");
  const [searchResults, setSearchResults] = useState<{ title: string; price: number; mallName: string; image: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [editingWishlist, setEditingWishlist] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const celebratedCountRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (view !== "result") return;
    const id = setInterval(() => {
      const current = new Date();
      setNow(current.getTime());
      if (isWithinWorkWindow(current, workStart, workEnd, weekdaysOnly)) {
        setEarnedSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [view, workStart, workEnd, weekdaysOnly]);

  const salaryManwon = Number(salaryManwonDigits || "0");
  const salary = salaryManwon * 10000;
  const workdaysNum = Math.max(1, Number(workdays || "0"));
  const hoursNum = Math.max(0.1, diffHours(workStart, workEnd));

  const perSecond = salary / (workdaysNum * hoursNum * 3600);

  const earned = earnedSec * perSecond;

  const workStatus = useMemo(
    () => getWorkStatus(new Date(now), workStart, workEnd, weekdaysOnly),
    [now, workStart, workEnd, weekdaysOnly]
  );

  useEffect(() => {
    if (view !== "result") return;
    for (const w of wishlist) {
      const count = Math.floor(earned / w.priceWon);
      const prevCount = celebratedCountRef.current.get(w.id) ?? 0;
      if (count > prevCount) {
        celebratedCountRef.current.set(w.id, count);
        setCelebration({ item: w, count });
        setConfetti(makeConfetti());
        break;
      }
    }
  }, [earned, wishlist, view]);

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 3200);
    return () => clearTimeout(t);
  }, [celebration]);

  useEffect(() => {
    if (confetti.length === 0) return;
    const t = setTimeout(() => setConfetti([]), 1800);
    return () => clearTimeout(t);
  }, [confetti]);

  const handleSalaryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setSalaryManwonDigits(digits);
  };

  const handleItemPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setNewItemPriceDigits(digits);
  };

  const handleSearch = async () => {
    if (!newItemName.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch(
        `/api/search-shop?query=${encodeURIComponent(newItemName.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "검색에 실패했어요.");
        return;
      }
      setSearchResults(data.items || []);
    } catch {
      setSearchError("검색 중 오류가 발생했어요.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (r: { title: string; price: number; image: string }) => {
    setNewItemPriceDigits(String(r.price));
    setSearchResults([]);
  };

  const handleQuickAdd = (name: string, price: number) => {
    setWishlist((prev) => {
      if (prev.some((w) => w.name === name)) return prev;
      return [...prev, { id: crypto.randomUUID(), name, priceWon: price }].sort(
        (a, b) => a.priceWon - b.priceWon
      );
    });
  };

  const handleAddItem = () => {
    const price = Number(newItemPriceDigits || "0");
    if (!newItemName.trim() || price <= 0) return;
    setWishlist((prev) =>
      [...prev, { id: crypto.randomUUID(), name: newItemName.trim(), priceWon: price }].sort(
        (a, b) => a.priceWon - b.priceWon
      )
    );
    setNewItemName("");
    setNewItemPriceDigits("");
  };

  const handleRemoveItem = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const handleUpdateItemName = (id: string, name: string) => {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
  };

  const handleUpdateItemPrice = (id: string, rawValue: string) => {
    const digits = rawValue.replace(/[^0-9]/g, "");
    const price = Number(digits || "0");
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, priceWon: price } : w)));
    if (price > 0) {
      celebratedCountRef.current.set(id, Math.floor(earned / price));
    }
  };

  const handleConfirm = () => {
    if (!salaryManwonDigits || salary <= 0) return;
    celebratedCountRef.current = new Map();
    setCelebration(null);
    setConfetti([]);
    setEditingWishlist(false);
    setEarnedSec(0);
    setStartTime(Date.now());
    setNow(Date.now());
    setView("result");
  };

  const handleBack = () => {
    setView("form");
    setStartTime(null);
    setEarnedSec(0);
    celebratedCountRef.current = new Map();
    setCelebration(null);
    setConfetti([]);
    setEditingWishlist(false);
  };

  if (view === "result") {
    return (
      <div className="w-full max-w-[420px] mx-auto min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
        {confetti.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-20 flex items-center justify-center">
            {confetti.map((p) => (
              <span
                key={p.id}
                className="absolute text-[22px] animate-[confetti-burst_1.1s_ease-out_forwards]"
                style={
                  {
                    "--tx": `${p.tx}px`,
                    "--ty": `${p.ty}px`,
                    "--r": `${p.rotate}deg`,
                    animationDelay: `${p.delay}s`,
                  } as React.CSSProperties
                }
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        {celebration && (
          <div className="fixed top-1/2 left-1/2 z-30 bg-white border border-neutral-200 shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center animate-[toast-pop_0.4s_ease-out_forwards]">
            <div className="text-[48px] mb-1 leading-none">{getEmoji(celebration.item.name)}</div>
            <div className="text-[16px] font-bold text-neutral-900 mb-0.5">
              {celebration.item.name} {celebration.count}개 벌었어요!
            </div>
            <div className="text-[13px] text-neutral-400">
              {fmtWon(celebration.item.priceWon)}원짜리 기준
            </div>
          </div>
        )}

        <div className="text-[13px] text-neutral-400 mb-3 tracking-wide">지금까지</div>
        <div className="font-mono font-bold text-[clamp(32px,9vw,52px)] text-neutral-900 tabular-nums mb-2 text-center">
          {fmtWon(earned)}원
        </div>
        <div className="text-[15px] text-neutral-500 mb-1">벌었습니다</div>
        <div className="text-[12.5px] text-neutral-400 mb-8">
          {workStatus === "working" && "근무 중 · 실시간으로 올라가고 있어요"}
          {workStatus === "before" && `${workStart}부터 카운트가 시작돼요`}
          {workStatus === "after" && "오늘 근무 종료 · 내일 다시 올라가요"}
          {workStatus === "weekend" && "주말 · 카운트가 멈춰있어요"}
        </div>

        {wishlist.length > 0 && !editingWishlist && (
          <div className="w-full border border-neutral-200 rounded-xl overflow-hidden mb-4">
            {wishlist.map((w, i) => {
              const count = Math.floor(earned / w.priceWon);
              const remainingWon = w.priceWon * (count + 1) - earned;
              const remainingSec = perSecond > 0 ? remainingWon / perSecond : Infinity;
              return (
                <div
                  key={w.id}
                  className={`px-4 py-3.5 text-[17px] ${
                    i !== wishlist.length - 1 ? "border-b border-neutral-200" : ""
                  } ${count > 0 ? "bg-neutral-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-800">
                      <span className="mr-1.5">{getEmoji(w.name)}</span>
                      {w.name}
                    </span>
                    <span className="font-mono text-neutral-400 text-[15px]">
                      {fmtWon(w.priceWon)}원
                    </span>
                  </div>
                  <div className="text-[14px] text-neutral-500">
                    {count > 0 && (
                      <span className="font-semibold text-neutral-900">{count}개 벌었어요</span>
                    )}
                    {count > 0 && " · "}
                    다음까지 {formatDuration(remainingSec)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingWishlist && (
          <div className="w-full border border-neutral-200 rounded-xl p-3 mb-4">
            {wishlist.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 py-2 border-b last:border-b-0 border-neutral-100"
              >
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleUpdateItemName(w.id, e.target.value)}
                  className="flex-1 min-w-0 border border-neutral-300 rounded-md px-2 py-1.5 text-[13px] outline-none focus:border-neutral-900"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatWithCommas(String(w.priceWon))}
                  onChange={(e) => handleUpdateItemPrice(w.id, e.target.value)}
                  className="w-[90px] border border-neutral-300 rounded-md px-2 py-1.5 text-[13px] text-right font-mono outline-none focus:border-neutral-900"
                />
                <button
                  onClick={() => handleRemoveItem(w.id)}
                  className="text-neutral-400 hover:text-neutral-700 text-[14px]"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}

            <div className="flex gap-2 mt-3 mb-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="예: 커피"
                className="flex-1 min-w-0 border border-neutral-300 text-neutral-900 text-[13px] px-2 py-1.5 rounded-md outline-none focus:border-neutral-900"
              />
              <button
                onClick={handleSearch}
                disabled={!newItemName.trim() || searching}
                className="shrink-0 text-[12.5px] font-medium text-neutral-900 border border-neutral-300 rounded-md px-2.5 py-1.5 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed"
              >
                {searching ? "검색 중..." : "가격 검색"}
              </button>
            </div>

            {searchError && (
              <div className="text-[12px] text-red-500 mb-2">{searchError}</div>
            )}

            {searchResults.length > 0 && (
              <div className="mb-2 border border-neutral-200 rounded-md overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className={`w-full text-left px-2.5 py-1.5 text-[12px] hover:bg-neutral-50 flex items-center gap-2 ${
                      i !== searchResults.length - 1 ? "border-b border-neutral-200" : ""
                    }`}
                  >
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image}
                        alt=""
                        className="w-8 h-8 rounded object-cover shrink-0 bg-neutral-100"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-neutral-100 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 truncate text-neutral-700">
                      {r.title}
                      <span className="text-neutral-400"> · {r.mallName}</span>
                    </span>
                    <span className="font-mono text-neutral-900 shrink-0">
                      {fmtWon(r.price)}원
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={formatWithCommas(newItemPriceDigits)}
                onChange={handleItemPriceChange}
                placeholder="가격 직접 입력 (원)"
                className="flex-1 min-w-0 border border-neutral-300 text-neutral-900 text-[13px] px-2 py-1.5 rounded-md outline-none focus:border-neutral-900 text-right font-mono"
              />
              <button
                onClick={handleAddItem}
                className="shrink-0 text-[12.5px] font-medium text-neutral-900 border border-neutral-300 rounded-md px-2.5 py-1.5 hover:bg-neutral-50"
              >
                추가
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setEditingWishlist((v) => !v)}
          className="text-[13px] text-neutral-400 underline underline-offset-4 hover:text-neutral-600 mb-3"
        >
          {editingWishlist ? "완료" : "위시리스트 수정"}
        </button>

        <div className="w-full mb-6">
          <div className="grid grid-cols-3 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
            {RATE_INTERVALS.map((r) => (
              <div key={r.label} className="bg-white text-center py-4 px-2">
                <div className="text-[13px] text-neutral-400 mb-1.5">{r.label}당</div>
                <div className="font-mono text-[16px] font-semibold text-neutral-900 tabular-nums">
                  {fmtWon(perSecond * r.seconds)}원
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200 mt-2">
            <div className="bg-white text-center py-4 px-2">
              <div className="text-[13px] text-neutral-400 mb-1.5">1시간당</div>
              <div className="font-mono text-[16px] font-semibold text-neutral-900 tabular-nums">
                {fmtWon(perSecond * 3600)}원
              </div>
            </div>
            <div className="bg-white text-center py-4 px-2">
              <div className="text-[13px] text-neutral-400 mb-1.5">하루당</div>
              <div className="font-mono text-[16px] font-semibold text-neutral-900 tabular-nums">
                {fmtWon(perSecond * hoursNum * 3600)}원
              </div>
            </div>
            <div className="bg-white text-center py-4 px-2">
              <div className="text-[13px] text-neutral-400 mb-1.5">한 달당</div>
              <div className="font-mono text-[16px] font-semibold text-neutral-900 tabular-nums">
                {fmtWon(salary / 12)}원
              </div>
            </div>
          </div>
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
    <div className="w-full max-w-[380px] mx-auto min-h-screen flex flex-col justify-center px-6 py-10">
      <h1 className="text-[19px] font-bold text-neutral-900 mb-8 text-center">급여 미터기</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] text-neutral-500 mb-1.5">연봉 (만원)</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(salaryManwonDigits)}
              onChange={handleSalaryChange}
              placeholder="5000"
              className="w-full border border-neutral-300 text-neutral-900 text-[16px] pl-3 pr-14 py-2.5 rounded-lg outline-none focus:border-neutral-900 text-right font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-400">
              만원
            </span>
          </div>
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
          <label className="block text-[13px] text-neutral-500 mb-1.5">근무 시간</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="w-full border border-neutral-300 text-neutral-900 text-[14px] px-2 py-2.5 rounded-lg outline-none focus:border-neutral-900 font-mono"
            />
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="w-full border border-neutral-300 text-neutral-900 text-[14px] px-2 py-2.5 rounded-lg outline-none focus:border-neutral-900 font-mono"
            />
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <input
              type="checkbox"
              id="weekdaysOnly"
              checked={weekdaysOnly}
              onChange={(e) => setWeekdaysOnly(e.target.checked)}
              className="w-[15px] h-[15px] accent-neutral-900"
            />
            <label htmlFor="weekdaysOnly" className="text-[12.5px] text-neutral-500">
              주말은 카운트 멈추기
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-200">
          <label className="block text-[13px] text-neutral-500 mb-2 mt-4">
            위시리스트 <span className="text-neutral-400">(선택, 금액 도달하면 알려드려요)</span>
          </label>

          <div className="mb-4">
            <div className="text-[11.5px] text-neutral-400 mb-2">
              사람들이 많이 등록해요 · 눌러서 바로 추가 (참고 가격, 나중에 수정 가능)
            </div>
            <div className="space-y-2.5">
              {SUGGESTED_GROUPS.map((g) => (
                <div key={g.category}>
                  <div className="text-[11px] font-semibold text-neutral-500 mb-1">
                    {g.category}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleQuickAdd(s.name, s.price)}
                        className="text-[12px] text-neutral-600 border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-neutral-50 flex items-center gap-1"
                      >
                        <span>{getEmoji(s.name)}</span>
                        <span>{s.name}</span>
                        <span className="text-neutral-400">· {fmtWon(s.price)}원</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {wishlist.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {wishlist.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-[13px] bg-neutral-50 rounded-lg px-3 py-2"
                >
                  <span className="text-neutral-700">
                    <span className="mr-1.5">{getEmoji(w.name)}</span>
                    {w.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-500">{fmtWon(w.priceWon)}원</span>
                    <button
                      onClick={() => handleRemoveItem(w.id)}
                      className="text-neutral-400 hover:text-neutral-700 text-[13px] leading-none"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="예: 커피"
              className="flex-1 min-w-0 border border-neutral-300 text-neutral-900 text-[14px] px-3 py-2 rounded-lg outline-none focus:border-neutral-900"
            />
            <button
              onClick={handleSearch}
              disabled={!newItemName.trim() || searching}
              className="shrink-0 text-[13px] font-medium text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 hover:bg-neutral-50 disabled:text-neutral-300 disabled:cursor-not-allowed"
            >
              {searching ? "검색 중..." : "가격 검색"}
            </button>
          </div>

          {searchError && (
            <div className="text-[12px] text-red-500 mb-2">{searchError}</div>
          )}

          {searchResults.length > 0 && (
            <div className="mb-3 border border-neutral-200 rounded-lg overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className={`w-full text-left px-3 py-2 text-[12.5px] hover:bg-neutral-50 flex items-center gap-3 ${
                    i !== searchResults.length - 1 ? "border-b border-neutral-200" : ""
                  }`}
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover shrink-0 bg-neutral-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-neutral-100 shrink-0" />
                  )}
                  <span className="flex-1 min-w-0 truncate text-neutral-700">
                    {r.title}
                    <span className="text-neutral-400"> · {r.mallName}</span>
                  </span>
                  <span className="font-mono text-neutral-900 shrink-0">
                    {fmtWon(r.price)}원
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={formatWithCommas(newItemPriceDigits)}
              onChange={handleItemPriceChange}
              placeholder="가격 직접 입력 (원)"
              className="flex-1 min-w-0 border border-neutral-300 text-neutral-900 text-[14px] px-3 py-2 rounded-lg outline-none focus:border-neutral-900 text-right font-mono"
            />
            <button
              onClick={handleAddItem}
              className="shrink-0 text-[13px] font-medium text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 hover:bg-neutral-50"
            >
              추가
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!salaryManwonDigits || salary <= 0}
          className="w-full bg-neutral-900 text-white text-[15px] font-medium py-3 rounded-lg mt-2 disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>
    </div>
  );
}