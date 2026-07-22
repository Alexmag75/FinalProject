import { VenueOption, BaseVenue } from "@/src/interfaces/venue";

export interface CategoryOption {
	id: string;
	name: string;
	description?: string | null;
	venues?: {
		venue: VenueOption;
	}[];
}

export interface CategoryData extends Omit<CategoryOption, "venues"> {
	description: string | null;
	venues: {
		venue: BaseVenue;
	}[];
}
