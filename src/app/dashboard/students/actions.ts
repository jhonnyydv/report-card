'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addStudent(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const rollNo = formData.get('rollNo') as string
    const parentEmail = formData.get('parentEmail') as string
    const classId = formData.get('classId') as string
    const fatherName = formData.get('fatherName') as string || ''
    const stream = formData.get('stream') as string || ''
    const contactNo = formData.get('contactNo') as string || ''

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
        .from('students')
        .insert({
            name,
            roll_no: rollNo,
            parent_email: parentEmail,
            class_id: classId,
            school_id: profile.school_id,
            father_name: fatherName,
            stream: stream,
            contact_no: contactNo
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/students')
    return { success: true }
}
