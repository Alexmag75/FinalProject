import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReviewModal from "@/src/app/components/ReviewModal";
import Header from "../app/components/Header";
import Footer from "../app/components/Footer";
import { QueryProvider } from "@/src/providers/QueryProvider";
import { AuthProvider } from "@/src/context/AuthContext";
import AgeVerificationModal from "@/src/app/components/AgeVerificationModal";
import { Toaster } from "sonner";
const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
	title: "Каталог Закладів",
	description: "Пошук найкращих баров, пабів та клубів міста",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="uk">
			<body
				className={`${inter.className} flex flex-col min-h-screen bg-slate-50 text-slate-900`}
			>
				<QueryProvider>
					<AuthProvider>
						<Header />
						<ReviewModal />
						<main className="flex-grow container mx-auto px-4 py-8">
							{children}
						</main>
						<Footer />
					</AuthProvider>
				</QueryProvider>
				<AgeVerificationModal />
				<Toaster richColors position="top-right" closeButton />
			</body>
		</html>
	);
}
