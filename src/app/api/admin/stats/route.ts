import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { cairoDate, readDayStats } from "@/lib/stats";

export const runtime = "edge";

const MAX_DAYS = 92;
const LOW_STOCK_LIMIT = 10;

function bad(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

function parseDay(s: string | null): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(s + "T00:00:00Z");
  if (isNaN(t)) return null;
  // reject overflow dates like 2026-02-31
  return new Date(t).toISOString().slice(0, 10) === s ? t : null;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const fromT = parseDay(sp.get("from"));
    const toT = parseDay(sp.get("to"));
    if (fromT === null || toT === null) return bad("صيغة التاريخ غير صحيحة، استخدم YYYY-MM-DD");
    if (fromT > toT) return bad("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
    const span = Math.round((toT - fromT) / 86400000) + 1;
    if (span > MAX_DAYS) return bad(`أقصى نطاق مسموح هو ${MAX_DAYS} يوماً`);

    const days: string[] = [];
    for (let i = 0; i < span; i++) days.push(new Date(fromT + i * 86400000).toISOString().slice(0, 10));
    const dayIndex = new Map(days.map((d, i) => [d, i]));

    const [orders, products, dayStats] = await Promise.all([
      dbStore.getOrders(),
      dbStore.getProducts(),
      readDayStats(days),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));

    const daily = days.map((date) => ({
      date,
      sales: 0,
      orders: 0,
      validOrders: 0,
      avgOrder: 0,
      visits: dayStats[date]?.visits || 0,
      checkoutStarts: dayStats[date]?.checkout_starts || 0,
    }));

    let sales = 0;
    let ordersCount = 0;
    let validOrders = 0;
    let newOrders = 0;
    let lostOrders = 0;
    let netProfit = 0;
    let profitComplete = true;
    const top = new Map<string, { productId: string; title: string; image: string; quantity: number; revenue: number }>();

    for (const o of orders) {
      const day = cairoDate(o.created_at);
      const idx = dayIndex.get(day);
      if (idx === undefined) continue;
      ordersCount++;
      daily[idx].orders++;
      if (o.status === "pending") newOrders++;
      if (o.status === "cancelled" || o.status === "returned") {
        lostOrders++;
        continue;
      }
      const amount = Number(o.final_amount) || 0;
      const qty = Number(o.quantity) || 1;
      validOrders++;
      sales += amount;
      daily[idx].sales += amount;
      daily[idx].validOrders++;

      const p = productById.get(o.product_id) || o.product;
      const cost = Number(p?.cost_price);
      if (p && cost > 0) netProfit += ((Number(o.unit_price) || 0) - cost) * qty;
      else profitComplete = false;

      const t = top.get(o.product_id) || {
        productId: o.product_id,
        title: p?.title_ar || "منتج",
        image: p?.images?.[0] || "",
        quantity: 0,
        revenue: 0,
      };
      t.quantity += qty;
      t.revenue += amount;
      top.set(o.product_id, t);
    }

    for (const d of daily) d.avgOrder = d.validOrders > 0 ? Math.round(d.sales / d.validOrders) : 0;

    const visits = daily.reduce((s, d) => s + d.visits, 0);
    const checkoutStarts = daily.reduce((s, d) => s + d.checkoutStarts, 0);

    const topProducts = Array.from(top.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);

    const lowStock = products
      .filter((p) => typeof p.stock_quantity === "number" && p.stock_quantity <= LOW_STOCK_LIMIT)
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 10)
      .map((p) => ({ id: p.id, title: p.title_ar, image: p.images?.[0] || "", stock: p.stock_quantity }));

    return NextResponse.json(
      {
        success: true,
        range: { from: days[0], to: days[days.length - 1], days: span },
        totals: {
          sales,
          orders: ordersCount,
          validOrders,
          avgOrder: validOrders > 0 ? Math.round(sales / validOrders) : 0,
          newOrders,
          lostOrders,
          lostRate: ordersCount > 0 ? Math.round((lostOrders / ordersCount) * 1000) / 10 : 0,
          netProfit: Math.round(netProfit),
          profitComplete,
          visits,
          checkoutStarts,
        },
        daily,
        topProducts,
        lowStock,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ success: false, error: "تعذر تحميل الإحصائيات" }, { status: 500 });
  }
}
