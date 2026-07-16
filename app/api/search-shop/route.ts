import { NextRequest, NextResponse } from "next/server";

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "서버에 API 키가 설정되어 있지 않아요." },
      { status: 500 }
    );
  }

  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(
    query
  )}&display=8&start=1&sort=sim`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "검색에 실패했어요." },
        { status: res.status }
      );
    }

    const data = await res.json();

    const items = (data.items || []).map(
      (item: {
        title?: string;
        lprice?: string;
        mallName?: string;
        image?: string;
      }) => ({
        title: stripTags(item.title || ""),
        price: Number(item.lprice) || 0,
        mallName: item.mallName || "",
        image: item.image || "",
      })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "검색 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
