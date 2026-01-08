import { createClient } from "@/lib/supabase/server"
import { MarksEntryTable } from "@/components/marks-entry-table"
import { notFound } from "next/navigation"

export default async function ExamMarksPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // Fetch Exam Details
    const { data: exam } = await supabase
        .from('exams')
        .select('*, classes(*)')
        .eq('id', id)
        .single()

    if (!exam) notFound()

    // Fetch Students in the Class
    const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', exam.class_id)
        .order('roll_no')

    // Fetch Existing Marks
    const { data: existingMarks } = await supabase
        .from('marks')
        .select('*')
        .eq('exam_id', id)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{exam.name}</h2>
                <p className="text-muted-foreground">
                    Class: {exam.classes?.name} • Date: {exam.date}
                </p>
            </div>

            <MarksEntryTable
                students={students || []}
                initialMarks={existingMarks || []}
                examId={id}
            />
        </div>
    )
}
