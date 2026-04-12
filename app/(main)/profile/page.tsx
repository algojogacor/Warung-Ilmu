import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default async function ProfileRedirectPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) {
    redirect(`/profile/${session.user.id}`)
  } else {
    redirect("/login")
  }
}
