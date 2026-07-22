export interface RatingItem {
	id: string;
	rating: number;
	createdAt: string;
	venueId?: string;
	venue: {
		id: string;
		name: string;
		type?: string;
	};
}
