import Link from "next/link";

export default function LegalFooter() {
  return <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 px-6 py-6 text-xs text-white/38"><span>© {new Date().getFullYear()} Cosmic OS</span><Link href="/privacy" className="hover:text-white/75">Privacy</Link><Link href="/terms" className="hover:text-white/75">Terms</Link><Link href="/support" className="hover:text-white/75">Support</Link></footer>;
}
