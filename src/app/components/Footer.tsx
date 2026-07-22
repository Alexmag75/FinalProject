import Link from "next/link";

export default function Footer() {
	return (
		<footer className="w-full border-t border-slate-200 bg-white py-6">
			<div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row text-sm text-slate-500">
				<p>© {new Date().getFullYear()} Пʼячок. Усі права захищено.</p>
				<div className="flex space-x-6">
					<Link href="/info/privacy" className="hover:underline text-slate-400">
						Політика конфіденційності
					</Link>
					<Link href="/info/terms" className="hover:underline text-slate-400">
						Правила використання
					</Link>
				</div>
			</div>
		</footer>
	);
}
