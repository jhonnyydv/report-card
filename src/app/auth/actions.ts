'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { AuthError } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const schoolName = formData.get('schoolName') as string

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                school_name: schoolName, // Store metadata if needed
                role: 'admin' // First user is admin
            }
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: "User creation failed" }
    }

    // 2. Create the School (Tenant)
    const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([{ name: schoolName }])
        .select()
        .single()

    if (schoolError) {
        // Cleanup auth user if school creation fails? 
        // ideally transaction, but for now just error out
        return { error: 'Failed to create school: ' + schoolError.message }
    }

    // 3. Create the Profile linked to School
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: authData.user.id,
            email: email,
            school_id: schoolData.id,
            role: 'admin',
            full_name: 'Admin'
        }])

    if (profileError) {
        return { error: 'Failed to create profile: ' + profileError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
