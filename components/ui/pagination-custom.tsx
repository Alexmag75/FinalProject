"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export default function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;
	return (
		<div className="flex items-center justify-center gap-2 pt-4">
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 rounded-lg border-slate-200"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
			>
				<ChevronLeft size={14} />
			</Button>

			<div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
				<span className="px-2 py-1 bg-slate-100 rounded-md text-slate-900">
					{currentPage}
				</span>
				<span className="text-slate-400">из</span>
				<span className="px-1">{totalPages}</span>
			</div>

			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 rounded-lg border-slate-200"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				<ChevronRight size={14} />
			</Button>
		</div>
	);
}
