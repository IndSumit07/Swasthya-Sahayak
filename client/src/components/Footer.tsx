import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-8 pb-6 border-t border-slate-200/80 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <div className="w-5 h-5 rounded-md bg-[#0E4A43] flex items-center justify-center text-[#E5F973]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span>
            © {new Date().getFullYear()} Swasthya Sahayak. Government of Maharashtra Initiative (PS 26133).
          </span>
        </div>

        <div className="flex items-center gap-6 font-medium text-slate-600">
          <Link href="#privacy" className="hover:text-[#0E4A43] transition-colors">
            Privacy Policy
          </Link>
          <Link href="#terms" className="hover:text-[#0E4A43] transition-colors">
            Terms of Service
          </Link>
          <Link href="#abdm" className="hover:text-[#0E4A43] transition-colors">
            ABDM Compliance
          </Link>
          <Link href="#helpline" className="hover:text-[#0E4A43] transition-colors">
            104 / 108 Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
