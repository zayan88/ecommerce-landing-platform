import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { SafqaClient } from "@/lib/safqa/safqa-client";
import { OrderStatus } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await dbStore.getOrder(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, action } = body;

    // Retry Safqa Sync action
    if (action === "retry_safqa") {
      const result = await SafqaClient.retrySync(params.id);
      return NextResponse.json({ success: result.success, result });
    }

    if (status) {
      const updated = await dbStore.updateOrderStatus(params.id, status as OrderStatus);
      return NextResponse.json({ success: updated });
    }

    return NextResponse.json({ success: false, error: "لا يوجد إجراء محدد" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
