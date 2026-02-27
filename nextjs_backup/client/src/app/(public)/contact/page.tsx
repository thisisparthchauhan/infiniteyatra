// Contact page — SSG
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us | Infinite Yatra',
    description: 'Get in touch with Infinite Yatra. Call +91 9265799325 or email infiniteyatra@gmail.com. We plan custom tours across India.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24">
            {/* TODO: Migrate ContactNew.jsx here — replace useNavigate → useRouter, Link to= → href= */}
            <p className="p-8 text-white/60">Contact — migrate ContactNew.jsx here</p>
        </div>
    );
}
