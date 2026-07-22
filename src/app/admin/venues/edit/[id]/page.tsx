"use client";

import { useParams } from "next/navigation";
import EditVenue from "@/src/app/admin/venues/EditVenue";

export default function AdminEditVenuePageRoute() {
	const params = useParams();
	const id = params?.id as string;

	if (!id) {
		return (
			<div className="p-8 text-center text-slate-500">
				Некоректний ідентифікатор закладу
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<EditVenue />
		</div>
	);
}
