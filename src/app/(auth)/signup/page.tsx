'use client'

import Link from "next/link"
import { useFormStatus } from "react-dom"
import { signup } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Sign Up"}
        </Button>
    )
}

export default function SignupPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Create School Account</CardTitle>
                <CardDescription>
                    Register your school to start managing marks.
                </CardDescription>
            </CardHeader>
            <form action={signup}>
                <CardContent className="space-y-2">
                    <div className="space-y-1">
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input id="schoolName" name="schoolName" required placeholder="Springfield High" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required placeholder="admin@school.com" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <SubmitButton />
                    <div className="text-sm text-muted-foreground text-center">
                        Already have an account?{" "}
                        <Link href="/login" className="underline text-primary">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
