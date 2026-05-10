"use client"

import { useState } from "react"
import { signUp, signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.length < 3) {
      toast.error("Nama harus lebih dari 3 karakter")
      return
    }
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }

    setLoading(true)
    const res = await signUp.email({ name, email, password })
    setLoading(false)

    if (res.error) {
      toast.error(res.error.message || "Gagal mendaftar. Silakan coba lagi.")
    } else {
      toast.success("Akun berhasil dibuat! Selamat datang di Warung Ilmu.")
      router.push("/")
    }
  }

  const handleGoogleLogin = async () => {
    // social sign in does both sign in and sign up automatically in better auth
    await signIn.social({ provider: "google" })
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
            <CardDescription>
              Bergabung dengan ribuan pelajar lainnya di Warung Ilmu.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar"}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Atau daftar dengan
                  </span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
                Google
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Masuk di sini
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
