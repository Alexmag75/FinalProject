export interface MeetupItem {
	id: string;
	dateTime: string;
	description: string | null;
	contactInfo: string;
	gender: "ANY" | "MALE" | "FEMALE";
	companySize: number;
	whoPays: "EACH_OWN" | "I_PAY" | "YOU_PAY";
	budget: number;
	venue: {
		name: string;
		address: string;
		mainImage: string;
	};
	user: {
		id: string;
		name: string | null;
		avatarUrl?: string | null;
	};
}

export interface MeetupModalProps {
	isOpen: boolean;
	onClose: () => void;
	venueId?: string;
	venueName?: string;
	onSuccess?: () => void;
}
