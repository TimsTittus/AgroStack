import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  if (session.user.role === "farmer") {
    redirect("/farmer/dashboard");
  }
  if (session.user.role === "buyer") {
    redirect("/buyer/dashboard");
  }
  return children;
}