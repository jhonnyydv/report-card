
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b">
                <div className="container flex h-16 items-center px-4">
                    <h2 className="text-lg font-semibold">ReportCard Pro</h2>
                    <nav className="ml-6 flex items-center space-x-4 lg:space-x-6">
                        <a href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">Overview</a>
                        <a href="/dashboard/classes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Classes</a>
                        <a href="/dashboard/students" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Students</a>
                        <a href="/dashboard/exams" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Exams</a>
                    </nav>
                    <div className="ml-auto flex items-center space-x-4">
                        <form action="/api/auth/signout" method="post">
                            <button className="text-sm text-red-500 hover:underline">Sign Out</button>
                        </form>
                    </div>
                </div>
            </header>
            <div className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </div>
        </div>
    )
}
