'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface MarkEntry {
    student_id: string
    score: number
    subject_id?: string // For MVP maybe just one subject or handled differently
}

export async function saveMarks(examId: string, marks: MarkEntry[]) {
    const supabase = await createClient()

    // Get current user for auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get school_id from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    // Prepare upsert payloads
    // We need to fetch a default subject ID if we aren't using multiple subjects yet.
    // For MVP, allow 'General' subject or handle it.
    // HACK: For MVP, let's auto-create a 'General' subject for the school if missing?
    // OR just assume one subject exists. 

    // Let's create a 'General' subject on the fly if needed
    let { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('name', 'General')
        .single()

    if (!subject) {
        const { data: newSubject } = await supabase
            .from('subjects')
            .insert({ name: 'General', school_id: profile.school_id })
            .select()
            .single()
        subject = newSubject
    }

    if (!subject) return { error: "Failed to resolve Subject" }

    const paylaod = marks.map(m => ({
        exam_id: examId,
        student_id: m.student_id,
        subject_id: subject.id,
        score_obtained: m.score,
        school_id: profile.school_id,
        max_marks: 100 // Default
    }))

    // Upsert marks (requires unique constraint on exam_id, student_id, subject_id)
    const { error } = await supabase
        .from('marks')
        .upsert(paylaod, { onConflict: 'exam_id, student_id, subject_id' })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/exams/${examId}`)
    return { success: true }
}
