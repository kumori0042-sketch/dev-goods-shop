import { put } from "@vercel/blob";

// 모의 주문 접수. 실제 결제/배송 없음 — 데모 포트폴리오용.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "허용되지 않은 메서드입니다." });
    return;
  }

  const { name, address, items, total } = req.body || {};
  if (!name || !address || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "받는 사람, 배송지, 상품 목록이 필요해요." });
    return;
  }

  const orderId = new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const record = {
    orderId,
    name: String(name).slice(0, 60),
    address: String(address).slice(0, 200),
    items: items.slice(0, 30).map((i) => ({
      id: String(i.id || "").slice(0, 40),
      name: String(i.name || "").slice(0, 80),
      qty: Math.max(1, Math.min(99, Number(i.qty) || 1)),
      price: Math.max(0, Number(i.price) || 0)
    })),
    total: Math.max(0, Number(total) || 0),
    ts: new Date().toISOString(),
    demo: true
  };

  await put(`orders/${orderId}.json`, JSON.stringify(record), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false
  });

  res.status(200).json({ ok: true, orderId });
}
