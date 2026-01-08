'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// We need a specialized bulk action because we might need to create classes
export async function bulkImportStudentsWrapper(data: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: "Profile not found" }

    // 1. Cache existing classes to minimize DB hits
    const { data: existingClasses } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('school_id', profile.school_id)

    // Helper to find class ID
    let classesCache = existingClasses || []

    // Track new classes created in this session to avoid duplicates
    const newlyCreatedClasses: Record<string, string> = {} // "Name-Section" -> ID

    let successCount = 0
    let errorCount = 0
    let errors = []

    for (const row of data) {
        // Expected keys from CSV (mapped in client or here?)
        // Let's assume the client maps them to standard keys: 
        // name, rollNo, fatherName, className, section, stream, contactNo, email

        const className = row.className?.trim()
        const section = row.section?.trim() || ''
        const studentName = row.name?.trim()

        if (!studentName || !className) {
            errorCount++
            continue
        }

        // FIND OR CREATE CLASS
        let classId = classesCache.find(c =>
            c.name.toLowerCase() === className.toLowerCase() &&
            (c.section || '').toLowerCase() === section.toLowerCase()
        )?.id

        if (!classId && newlyCreatedClasses[`${className}-${section}`]) {
            classId = newlyCreatedClasses[`${className}-${section}`]
        }

        if (!classId) {
            // Create Class
            const { data: newClass, error: classError } = await supabase
                .from('classes')
                .insert([{
                    school_id: profile.school_id,
                    name: className,
                    section: section,
                    teacher_id: profile.id
                }])
                .select()
                .single()

            if (classError || !newClass) {
                errors.push(`Failed to create class ${className} ${section}`)
                errorCount++
                continue
            }

            classId = newClass.id
            // Add to cache
            classesCache.push(newClass)
            newlyCreatedClasses[`${className}-${section}`] = classId
        }

        // CREATE STUDENT
        const { error: studentError } = await supabase
            .from('students')
            .insert([{
                school_id: profile.school_id,
                class_id: classId,
                name: studentName,
                roll_no: row.rollNo,
                parent_email: row.email,
                father_name: row.fatherName,
                stream: row.stream,
                contact_no: row.contactNo
            }])

        if (studentError) {
            errors.push(`Failed to add ${studentName}: ${studentError.message}`)
            errorCount++
        } else {
            successCount++
        }
    }

    revalidatePath('/dashboard/students')
    revalidatePath('/dashboard/classes')

    return {
        success: true,
        count: successCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : null // Return first 5 errors only
    }
}
