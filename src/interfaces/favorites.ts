export interface FavoriteItem {
	id: string;
	venue: {
		id: string;
		name: string;
		mainImage: string | null;
		rating: number | null;
		type: string;
	};
}
