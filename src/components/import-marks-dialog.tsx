'use client'

import { useState } from "react"
import Papa from "papaparse"
import { saveMarks } from "@/app/dashboard/exams/[id]/actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MARKS_SAMPLE_CSV } from "@/lib/sample-data"
import { Download } from "lucide-react"

interface ImportMarksDialogProps {
    examId: string
    subjectId: string
    students: { id: string; roll_no: string | null; name: string }[]
    onSuccess?: () => void
}

export function ImportMarksDialog({ examId, subjectId, students, onSuccess }: ImportMarksDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [log, setLog] = useState<string>("")

    const handleDownloadSample = () => {
        const blob = new Blob([MARKS_SAMPLE_CSV], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "marks_sample.csv"
        a.click()
    }

    const handleImport = async () => {
        if (!file || !subjectId) return
        setLoading(true)
        setLog("Parsing CSV...")

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[]
                setLog(`Found ${rows.length} rows. Parsing...`)

                let successCount = 0
                let errorCount = 0

                // Create a map for RollNo -> StudentID for fast lookup
                const studentMap = new Map<string, string>()
                students.forEach(s => {
                    if (s.roll_no) studentMap.set(s.roll_no.toString(), s.id)
                    // Also map by Name? optional, sticking to Roll No for precision
                })

                for (const row of rows) {
                    const rollNo = row["Roll No"]
                    const score = row["Score"]

                    if (!rollNo || !score) {
                        errorCount++
                        continue
                    }

                    const studentId = studentMap.get(rollNo.toString())
                    if (!studentId) {
                        setLog(prev => prev + `\nWarning: Roll No ${rollNo} not found in this class.`)
                        errorCount++
                        continue
                    }

                    // Upsert mark
                    const res = await saveMarks(examId, [{
                        studentId: studentId,
                        subjectId: subjectId,
                        score: Number(score),
                        maxMarks: 100 // Defaulting to 100, or need to ask user?
                    }])

                    if (res?.success) successCount++
                    else errorCount++
                }

                setLog(prev => prev + `\nCompleted: ${successCount} updated.`)
                setLoading(false)
                if (successCount > 0) {
                    if (onSuccess) onSuccess()
                    setTimeout(() => setOpen(false), 2000)
                }
            },
            error: (error) => {
                setLog("Error parsing CSV: " + error.message)
                setLoading(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Marks</DialogTitle>
                    <DialogDescription>
                        Upload CSV with columns: Roll No, Score.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex justify-end">
                        <Button variant="link" onClick={handleDownloadSample} className="h-auto p-0 text-xs">
                            <Download className="mr-1 h-3 w-3" /> Download Sample
                        </Button>
                    </div>

                    <div className="text-sm font-medium">Subject: {subjectId ? "Selected" : "Select a Subject first"}</div>

                    <div className="space-y-2">
                        <Label htmlFor="file">CSV File</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    {log && (
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded max-h-32 overflow-auto whitespace-pre-wrap">
                            {log}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={!file || !subjectId || loading}>
                        {loading ? "Importing..." : "Start Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
