import { StatusVenues, TypeVenues } from "@/src/types/constants";
import { TagItem } from "@/src/interfaces/tags";
import { NewsVenueItem } from "@/src/interfaces/news";
import { Review } from "@/src/interfaces/review";

export interface BaseVenue {
	id: string;
	name: string;
	address: string | null;
	rating: number;
	isApproved: boolean;
}

export interface Venue extends BaseVenue {
	mainImage: string;
	workingHours: string;
	phone: string | null;
	averageCheck: number | "";
	type: TypeVenues;
	status: StatusVenues;
	views: number;
	hasWifi?: boolean;
	hasParking?: boolean;
	hasLiveMusic?: boolean;
	images?: any[];
}

export interface FullVenue
	extends Omit<Venue, "address" | "averageCheck" | "type" | "phone"> {
	address: string;
	averageCheck: number;
	type: TypeVenues | string;
	phone?: string | null;
	description?: string;
	website?: string;
	images: string[];
	hasWifi: boolean;
	hasParking: boolean;
	hasMusic: boolean;
	tags: TagItem[];
	news: NewsVenueItem[];
	reviews: Review[];
	isFavorite: boolean;
}

export interface VenueOption {
	id: string;
	name: string;
	address?: string;
	category?: string;
	rating?: number;
	mainImage?: string;
	reviewCount?: number;
}

export interface VenueFeedbackModalProps {
	venueId: string;
	venueName: string;
	isOpen: boolean;
	onClose: () => void;
}

export interface VenueMeetupsSectionProps {
	venueId: string;
	venueName: string;
}

export interface VenueCardItem {
	id: string;
	name: string;
	type: TypeVenues | string;
	mainImage: string;
	address: string;
	rating: number;
	averageCheck: number;
	hasWifi: boolean;
	hasParking: boolean;
	hasMusic: boolean;
	distance?: number;
	tags?: {
		id: string;
		name: string;
	}[];
}

export interface AdminVenueItem extends Omit<BaseVenue, "address"> {
	address: string;
	type: TypeVenues | string;
	phone: string;
	averageCheck: number;
	description?: string;
	createdAt: string;
	manager?: {
		id: string;
		name: string;
		email: string;
	} | null;
}
