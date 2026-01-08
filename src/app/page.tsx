import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center gap-8 p-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Student Marks Management</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          A simple, powerful tool for schools to manage student marks, generate reports, and analyze performance.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Create School Account</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
