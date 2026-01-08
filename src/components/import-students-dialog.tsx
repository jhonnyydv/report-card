'use client'

import { useState } from "react"
import Papa from "papaparse"
import { bulkImportStudentsWrapper } from "@/app/dashboard/students/bulk-actions"
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
import { Download, AlertCircle } from "lucide-react"

interface ImportStudentsDialogProps {
    classes: { id: string; name: string }[] // Kept for types but unused now
}

const SAMPLE_CSV = `Roll No.,Student Name,Father Name,Class,Section,Stream,Contact No.
101,John Doe,Robert Doe,XI,A,Science,9998887776
102,Jane Smith,William Smith,XI,B,Commerce,9998887775`

export function ImportStudentsDialog({ classes }: ImportStudentsDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [log, setLog] = useState<string>("")
    const [errorLog, setErrorLog] = useState<string[]>([])

    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "students_import_sample.csv"
        a.click()
    }

    const handleImport = async () => {
        if (!file) return
        setLoading(true)
        setLog("Parsing CSV...")
        setErrorLog([])

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[]
                setLog(`Found ${rows.length} rows. Starting import (this may take a moment)...`)

                // Transform keys to match what server expects
                const cleanData = rows.map((row) => ({
                    rollNo: row["Roll No."] || row["Roll No"],
                    name: row["Student Name"] || row["Name"],
                    fatherName: row["Father Name"],
                    className: row["Class"],
                    section: row["Section"],
                    stream: row["Stream"],
                    contactNo: row["Contact No."] || row["Contact No"],
                    email: row["Email"] || "" // Optional
                }))

                // Call Server Action
                const res = await bulkImportStudentsWrapper(cleanData)

                setLoading(false)

                if (res?.success) {
                    setLog(`Import Successful! Added/Processed ${res.count} students.`)
                    if (res.errors && res.errors.length > 0) {
                        setErrorLog(res.errors)
                    } else {
                        setTimeout(() => setOpen(false), 2000)
                    }
                } else {
                    setLog("Import Failed.")
                    if (res?.error) setErrorLog([res.error])
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
                <Button variant="outline">Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Students</DialogTitle>
                    <DialogDescription>
                        Upload CSV with columns: Roll No, Student Name, Father Name, Class, Section, Stream, Contact No.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex justify-end">
                        <Button variant="link" onClick={handleDownloadSample} className="h-auto p-0 text-xs">
                            <Download className="mr-1 h-3 w-3" /> Download Sample
                        </Button>
                    </div>

                    <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Classes will be auto-created if they don't exist (matching Name + Section).
                    </div>

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
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            {log}
                        </div>
                    )}
                    {errorLog.length > 0 && (
                        <div className="text-xs text-red-600 p-2 bg-red-50 rounded max-h-32 overflow-auto">
                            <strong>Errors:</strong>
                            <ul className="list-disc pl-4 mt-1">
                                {errorLog.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={!file || loading}>
                        {loading ? "Importing..." : "Start Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
