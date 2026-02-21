// Admin layout — no Navbar/Footer, client-only section
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#050505]">
            {children}
        </div>
    );
}
