import { createClient } from "@/lib/supabase/server"
import { ImportStudentsDialog } from "@/components/import-students-dialog"
import { AddStudentDialog } from "@/components/add-student-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StudentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .single()

    const schoolId = profile?.school_id

    // Fetch classes for the dialog dropdown
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name')

    // Fetch students with class info
    const { data: students } = await supabase
        .from('students')
        .select(`
      *,
      classes ( name )
    `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Students</h2>
                <div className="flex gap-2">
                    <ImportStudentsDialog classes={classes || []} />
                    <AddStudentDialog classes={classes || []} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Students</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Parent Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students?.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.roll_no}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.classes?.name}</TableCell>
                                    <TableCell>{student.parent_email}</TableCell>
                                </TableRow>
                            ))}
                            {students?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
