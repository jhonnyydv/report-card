import { createClient } from "@/lib/supabase/server"
import { CreateExamDialog } from "@/components/create-exam-dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ExamsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .single()

    const schoolId = profile?.school_id

    // Fetch classes for dropdown
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name')

    // Fetch exams
    const { data: exams } = await supabase
        .from('exams')
        .select(`
      *,
      classes ( name )
    `)
        .eq('school_id', schoolId)
        .order('date', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Exams</h2>
                <CreateExamDialog classes={classes || []} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exams?.map((exam) => (
                    <Card key={exam.id}>
                        <CardHeader>
                            <CardTitle>{exam.name}</CardTitle>
                            <CardDescription>{exam.classes?.name} • {exam.date}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <Link href={`/dashboard/exams/${exam.id}`}>Enter Marks</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {exams?.length === 0 && (
                    <div className="col-span-3 text-center text-muted-foreground p-10 border rounded-lg border-dashed">
                        No exams found. Schedule one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
