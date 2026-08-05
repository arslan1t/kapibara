import { PrismaClient } from "./src/generated/prisma";
import { createHash } from "node:crypto";
const db = new PrismaClient();
(async () => {
  const product = await db.product.findFirst({ where: { status: "available" } });
  if (!product) return console.log("no product; run npm run db:seed");
  const n = await db.$queryRaw<{ n: string }[]>`SELECT next_order_number() AS n`;
  const order = await db.order.create({
    data: {
      orderNumber: n[0]!.n,
      customerEmail: "victim@example.com",
      customerName: "Жертва Тестовая",
      customerPhone: "+79990000000",
      subtotal: 9990, deliveryPrice: 0, total: 9990,
      deliveryMethod: "courier", deliveryAddress: "Москва",
      // A guest order, claimed by a browser we are NOT simulating.
      guestClaimToken: createHash("sha256").update("someone-elses-token").digest("hex"),
      items: { create: { productId: product.id, productTitle: product.title, productSlug: product.slug, unitPrice: 9990, quantity: 1, lineTotal: 9990 } },
    },
  });
  console.log("ORDER_ID=" + order.id);
})().finally(() => db.$disconnect());
