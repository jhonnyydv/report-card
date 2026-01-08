import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"

export default async function StudentReportPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Student
    const { data: student } = await supabase
        .from('students')
        .select('*, classes(name), schools(name, address)')
        .eq('id', id)
        .single()

    if (!student) notFound()

    // Fetch all marks for this student
    // We need to join with exams and subjects to get names
    const { data: marks } = await supabase
        .from('marks')
        .select(`
      score_obtained,
      max_marks,
      exams ( name, date ),
      subjects ( name )
    `)
        .eq('student_id', id)
        .order('exams(date)', { ascending: true })

    // Group marks by Exam
    const examResults: Record<string, any> = {}
    marks?.forEach(mark => {
        const examName = mark.exams?.name || 'Unknown Exam'
        if (!examResults[examName]) {
            examResults[examName] = {
                date: mark.exams?.date,
                subjects: []
            }
        }
        examResults[examName].subjects.push({
            subject: mark.subjects?.name || 'General',
            score: mark.score_obtained,
            max: mark.max_marks
        })
    })

    return (
        <div className="space-y-6 print:space-y-0 print:p-0">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-3xl font-bold">Report Card</h2>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Report
                </Button>
            </div>

            <div className="border p-8 bg-white text-black print:border-none">
                <div className="text-center mb-8 border-b pb-4">
                    <h1 className="text-4xl font-bold uppercase tracking-widest">{student.schools?.name}</h1>
                    <p className="text-lg text-muted-foreground">{student.schools?.address}</p>
                    <h2 className="text-2xl font-semibold mt-4">OFFICIAL REPORT CARD</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
                    <div>
                        <span className="font-semibold text-gray-500">Student Name:</span> {student.name}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-500">Class:</span> {student.classes?.name}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-500">Roll No:</span> {student.roll_no}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-500">Parent Email:</span> {student.parent_email}
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(examResults).map(([examName, data]: [string, any]) => (
                        <div key={examName} className="mb-6 break-inside-avoid">
                            <h3 className="text-xl font-bold mb-2 border-l-4 border-black pl-3">{examName} <span className="text-sm font-normal text-gray-500">({data.date})</span></h3>
                            <table className="w-full text-left border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 p-2">Subject</th>
                                        <th className="border border-gray-300 p-2 text-right">Marks Obtained</th>
                                        <th className="border border-gray-300 p-2 text-right">Max Marks</th>
                                        <th className="border border-gray-300 p-2 text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.subjects.map((sub: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-gray-300 p-2">{sub.subject}</td>
                                            <td className="border border-gray-300 p-2 text-right">{sub.score}</td>
                                            <td className="border border-gray-300 p-2 text-right">{sub.max}</td>
                                            <td className="border border-gray-300 p-2 text-right font-semibold">
                                                {((sub.score / sub.max) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="border border-gray-300 p-2">Total</td>
                                        <td className="border border-gray-300 p-2 text-right">
                                            {data.subjects.reduce((sum: number, s: any) => sum + Number(s.score), 0)}
                                        </td>
                                        <td className="border border-gray-300 p-2 text-right">
                                            {data.subjects.reduce((sum: number, s: any) => sum + Number(s.max), 0)}
                                        </td>
                                        <td className="border border-gray-300 p-2 text-right">
                                            {((data.subjects.reduce((sum: number, s: any) => sum + Number(s.score), 0) / data.subjects.reduce((sum: number, s: any) => sum + Number(s.max), 0)) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t grid grid-cols-2 gap-20">
                    <div className="text-center border-t border-black pt-2 w-48 mx-auto">
                        Class Teacher
                    </div>
                    <div className="text-center border-t border-black pt-2 w-48 mx-auto">
                        Principal
                    </div>
                </div>
            </div>
        </div>
    )
}
