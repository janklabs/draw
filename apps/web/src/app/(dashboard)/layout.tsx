import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { UserMenu } from "@/components/auth/user-menu"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"
import { PenLine } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <PenLine className="h-5 w-5" />
            <span>Draw</span>
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      <Toaster />
    </div>
  )
}
