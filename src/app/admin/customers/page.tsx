import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Клиенты" };

export default async function AdminCustomersPage() {
  const customers = await db.user.findMany({
    where: { role: "customer" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: { select: { total: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Клиенты
      </h1>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-[15px] text-brown shadow-soft">
          Зарегистрированных клиентов пока нет.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-brown-400">Всего: {customers.length}</p>

          <ul className="mt-3 flex flex-col gap-2 md:hidden">
            {customers.map((c) => (
              <li key={c.id} className="rounded-2xl bg-white p-4 shadow-soft">
                <p className="font-semibold text-brown-dark">{c.fullName}</p>
                <p className="truncate text-sm text-brown-400">{c.email}</p>
                <p className="mt-2 text-sm text-brown">
                  Заказов: {c.orders.length} ·{" "}
                  {formatPrice(c.orders.reduce((s, o) => s + o.total, 0))}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-cream-200 text-brown-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Имя</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Почта</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Телефон</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Регистрация</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Заказов</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-5 py-3 text-brown-dark">{c.fullName}</td>
                    <td className="max-w-[16rem] truncate px-5 py-3 text-brown">{c.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-brown">{c.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-brown">
                      {c.createdAt.toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-5 py-3 text-right text-brown-dark">{c.orders.length}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-brown-dark">
                      {formatPrice(c.orders.reduce((s, o) => s + o.total, 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
