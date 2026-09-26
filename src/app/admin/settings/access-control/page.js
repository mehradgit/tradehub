// src/app/admin/settings/access-control/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AccessControlForm from "@/components/admin/AccessControlForm";

export const metadata = { title: "Access Control | Admin" };

export default async function AccessControlPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            font: "800 22px 'Manrope', sans-serif",
            color: "#13251f",
            marginBottom: 6,
          }}
        >
          Access Control Settings
        </h1>
        <p style={{ fontSize: 13, color: "#71807b" }}>
          Configure who can view which information on the platform.
        </p>
      </div>
      <AccessControlForm />
    </>
  );
}