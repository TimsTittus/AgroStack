import { Navbar } from "@/components/Navbar";
import { Sidebar } from "./_components/Sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "farmer") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f8faf6]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#d8f3dc] opacity-40 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-[#b7e4c7] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#95d5b2] opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <div className="flex">
          <Sidebar />
          {children}
        </div>
      </div>
    </div>
  );
}
