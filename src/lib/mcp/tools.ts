/**
 * MCP (Model Context Protocol) tools for the store: what an AI assistant the merchant connected may do.
 *
 * Deliberately small and safe: read orders / products / coupons, and three careful writes (order status,
 * product price/stock/visibility, nothing destructive). There is NO delete tool and NO way to read secrets
 * (API keys, tokens, PINs), customer IPs or user agents. Every input is validated here, never trusted.
 */
import { dbStore } from "@/lib/db/store";
import type { Order, OrderStatus } from "@/types";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (args: Record<string, any>) => Promise<unknown>;
}

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

const str = (v: unknown, max = 120): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** An order without internal / technical fields (IP, user agent, raw supplier responses). */
function compactOrder(o: Order) {
  return {
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    created_at: o.created_at,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    governorate: o.governorate,
    address: o.address,
    notes: o.notes || undefined,
    product: o.product?.title_ar,
    quantity: o.quantity,
    total: o.total_amount,
    shipping_fee: o.shipping_fee,
    discount: o.discount_amount,
    final_amount: o.final_amount,
    payment_method: o.payment_method,
    payment_status: o.tracking?.payment?.status,
    shipment: o.tracking?.shipping
      ? { provider: o.tracking.shipping.provider, tracking_number: o.tracking.shipping.tracking_number, state: o.tracking.shipping.state_label }
      : undefined,
    source: o.tracking?.utm_source || undefined,
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: "store_overview",
    description: "Order counts per status, number of products and active landing pages.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const page = await dbStore.getOrdersPage({}, { limit: 1, offset: 0, withTotal: true, relations: false });
      const [products, pages] = await Promise.all([dbStore.getProducts(), dbStore.getLandingPages()]);
      return {
        orders_total: page.total,
        orders_by_status: page.status_counts || null,
        products: products.length,
        active_products: products.filter((p) => p.status === "active").length,
        landing_pages: pages.length,
      };
    },
  },
  {
    name: "list_orders",
    description: "List orders, newest first. Optional filters: status, free-text search (name, phone, order number, governorate).",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: STATUSES },
        search: { type: "string", description: "name, phone, order number or governorate" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
    run: async (a) => {
      const status = STATUSES.includes(a.status) ? (a.status as OrderStatus) : undefined;
      const res = await dbStore.getOrdersPage({ status, search: str(a.search) || undefined }, { limit: int(a.limit, 1, 50, 20), offset: int(a.offset, 0, 100000, 0), withTotal: true });
      return { total: res.total, has_more: res.has_more, orders: res.orders.map(compactOrder) };
    },
  },
  {
    name: "get_order",
    description: "One order in full (by id or order number).",
    inputSchema: { type: "object", properties: { order: { type: "string" } }, required: ["order"], additionalProperties: false },
    run: async (a) => {
      const key = str(a.order);
      if (!key) throw new Error("order is required");
      const o = await dbStore.getOrder(key);
      if (!o) throw new Error("order not found");
      return compactOrder(o);
    },
  },
  {
    name: "update_order_status",
    description: "Change an order's status (pending, confirmed, shipped, delivered, cancelled, returned).",
    inputSchema: {
      type: "object",
      properties: { order: { type: "string" }, status: { type: "string", enum: STATUSES } },
      required: ["order", "status"],
      additionalProperties: false,
    },
    run: async (a) => {
      const key = str(a.order);
      if (!key || !STATUSES.includes(a.status)) throw new Error("order and a valid status are required");
      const o = await dbStore.getOrder(key);
      if (!o) throw new Error("order not found");
      const ok = await dbStore.updateOrderStatus(o.id, a.status as OrderStatus);
      if (!ok) throw new Error("the status could not be saved");
      return { order_number: o.order_number, from: o.status, to: a.status };
    },
  },
  {
    name: "list_products",
    description: "All products with price, stock and visibility.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const products = await dbStore.getProducts();
      return products.map((p) => ({
        id: p.id,
        title: p.title_ar,
        slug: p.slug,
        sku: p.sku,
        price: p.base_price,
        compare_at_price: p.compare_at_price,
        cost_price: p.cost_price,
        stock: p.stock_quantity,
        status: p.status,
        offers: (p.offers || []).map((o) => ({ id: o.id, title: o.title_ar, quantity: o.quantity, price: o.price, free_shipping: Boolean(o.free_shipping) })),
      }));
    },
  },
  {
    name: "update_product",
    description: "Change a product's selling price, stock or visibility (status active = shown, draft = hidden). Other fields are not touched.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        base_price: { type: "number", minimum: 1 },
        stock_quantity: { type: "integer", minimum: 0 },
        status: { type: "string", enum: ["active", "draft"] },
      },
      required: ["id"],
      additionalProperties: false,
    },
    run: async (a) => {
      const id = str(a.id);
      const p = id ? await dbStore.getProduct(id) : null;
      if (!p) throw new Error("product not found");
      const next: Record<string, unknown> = { ...p };
      if (a.base_price !== undefined) {
        const price = Math.round(Number(a.base_price));
        if (!Number.isFinite(price) || price < 1 || price > 10_000_000) throw new Error("base_price must be between 1 and 10,000,000");
        next.base_price = price;
      }
      if (a.stock_quantity !== undefined) {
        const stock = Math.round(Number(a.stock_quantity));
        if (!Number.isFinite(stock) || stock < 0 || stock > 10_000_000) throw new Error("stock_quantity must be a non-negative integer");
        next.stock_quantity = stock;
      }
      if (a.status !== undefined) {
        if (a.status !== "active" && a.status !== "draft") throw new Error("status must be active or draft");
        next.status = a.status;
      }
      const { product } = await dbStore.saveProductWithLandingPage(next as any, false);
      return { id: product.id, title: product.title_ar, price: product.base_price, stock: product.stock_quantity, status: product.status };
    },
  },
  {
    name: "list_coupons",
    description: "The merchant's coupons and automatic discounts with how many times each was used.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const s: any = await dbStore.getSettings();
      return (s.coupons || []).map((c: any) => ({ ...c, used: (s.coupon_usage || {})[c.code] || 0 }));
    },
  },
];

export function mcpToolList() {
  return MCP_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
