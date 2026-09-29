// src/app/(public)/checkout/page.js
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata = { title: "Checkout | B2B Food Hub" };

export default async function CheckoutPage({ searchParams }) {
  const session = await auth();
  if (!session) {
    redirect("/login?callbackUrl=/checkout");
  }

  const { planId, duration } = await searchParams;

  if (!planId || !duration) {
    redirect("/plans");
  }

  // ====== دریافت پلن و قیمت ======
  const [plan, price, user] = await Promise.all([
    prisma.plan.findUnique({ where: { id: planId } }),
    prisma.planPrice.findUnique({
      where: { planId_duration: { planId, duration: Number(duration) } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
      },
    }),
  ]);

  if (!plan || !price) {
    redirect("/plans");
  }

  // ====== چک کردن اطلاعات پروفایل ======
  const requiredFields = [
    {
      key: "name",
      label: "Full Name",
      value: user?.name || user?.companyName,
    },
    { key: "phone", label: "Phone Number", value: user?.phone },
    { key: "address", label: "Address", value: user?.address },
    { key: "city", label: "City", value: user?.city },
    { key: "postalCode", label: "Postal Code", value: user?.postalCode },
    { key: "country", label: "Country", value: user?.country },
  ];

  const missingFields = requiredFields
    .filter((f) => !f.value || String(f.value).trim().length < 2)
    .map((f) => ({ key: f.key, label: f.label }));

  const serializedPlan = {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    duration: Number(duration),
    price: Number(price.price),
  };

  return (
    <CheckoutClient
      plan={serializedPlan}
      user={{
        email: user?.email,
        name: user?.name,
        companyName: user?.companyName,
      }}
      missingFields={missingFields}
    />
  );
}