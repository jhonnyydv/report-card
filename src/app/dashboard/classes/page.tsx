import { createClient } from "@/lib/supabase/server"
import { AddClassDialog } from "@/components/add-class-dialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default async function ClassesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get school_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .single()

    // Fetch classes
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', profile?.school_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Classes</h2>
                <AddClassDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {classes?.map((cls) => (
                    <Card key={cls.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Class Name
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cls.name}</div>
                        </CardContent>
                    </Card>
                ))}
                {classes?.length === 0 && (
                    <div className="col-span-4 text-center text-muted-foreground p-10 border rounded-lg border-dashed">
                        No classes found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
