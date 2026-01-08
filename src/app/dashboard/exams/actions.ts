'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createExam(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const date = formData.get('date') as string
    const classId = formData.get('classId') as string

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get school_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { error } = await supabase
        .from('exams')
        .insert({
            name,
            date,
            class_id: classId,
            school_id: profile.school_id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/exams')
    return { success: true }
}
