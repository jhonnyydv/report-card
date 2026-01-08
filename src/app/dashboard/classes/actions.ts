'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addClass(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const section = formData.get('section') as string || ''

    // Get current user to find their school
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get school_id from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { error } = await supabase
        .from('classes')
        .insert({
            name,
            section,
            school_id: profile.school_id
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    return { success: true }
}
