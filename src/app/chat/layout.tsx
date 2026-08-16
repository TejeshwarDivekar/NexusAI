import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AuthProvider>{children}</AuthProvider>;
}
