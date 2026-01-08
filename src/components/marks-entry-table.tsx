'use client'

import { useState } from "react"
import { saveMarks } from "@/app/dashboard/exams/[id]/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ImportMarksDialog } from "@/components/import-marks-dialog"

export function MarksEntryTable({ students, initialMarks, examId }: {
    students: any[],
    initialMarks: any[],
    examId: string
}) {
    // Map student ID to score
    const [marks, setMarks] = useState<Record<string, string>>(() => {
        const acc: Record<string, string> = {}
        initialMarks.forEach(m => {
            acc[m.student_id] = m.score_obtained
        })
        return acc
    })
    const [saving, setSaving] = useState(false)

    // Helper to get subjectId from initial marks if available, else we might need another way
    // For MVP, we assume all marks in this list belong to the same Subject if we are in a Subject view?
    // Actually the previous code had a bug where it assumed one subject. 
    // Let's grab the first subject_id found, or if empty, we might fail to import.
    const subjectId = initialMarks.length > 0 ? initialMarks[0].subject_id : ''

    const handleScoreChange = (studentId: string, val: string) => {
        setMarks(prev => ({ ...prev, [studentId]: val }))
    }

    const handleSave = async () => {
        setSaving(true)
        const marksToSave = Object.entries(marks).map(([studentId, score]) => ({
            student_id: studentId,
            score: parseFloat(score) || 0
        }))

        const res = await saveMarks(examId, marksToSave)
        setSaving(false)

        if (res?.error) {
            alert("Error saving: " + res.error)
        } else {
            alert("Marks saved successfully!")
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="w-[150px]">Score (out of 100)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.roll_no}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={marks[student.id] || ''}
                                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {/* Only show Import if we can infer subject, otherwise it might be risky in this generic view */}
                    {/* For now, just show it. If subjectId is missing, the dialog handles it. */}
                    <ImportMarksDialog
                        examId={examId}
                        subjectId={subjectId}
                        students={students}
                        onSuccess={() => window.location.reload()}
                    />
                    <span className="text-xs text-muted-foreground">
                        {!subjectId && "(Add at least one mark manually first to set Subject)"}
                    </span>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Marks"}
                </Button>
            </div>
        </div>
    )
}
