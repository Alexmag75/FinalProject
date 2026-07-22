import { create } from "zustand";

interface UiState {
	isMobileMenuOpen: boolean;
	isReviewModalOpen: boolean;
	activeVenueIdForReview: string | null;
	toggleMobileMenu: () => void;
	openReviewModal: (venueId: string) => void;
	closeReviewModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
	isMobileMenuOpen: false,
	isReviewModalOpen: false,
	activeVenueIdForReview: null,

	toggleMobileMenu: () =>
		set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

	openReviewModal: (venueId) =>
		set({ isReviewModalOpen: true, activeVenueIdForReview: venueId }),
	closeReviewModal: () =>
		set({ isReviewModalOpen: false, activeVenueIdForReview: null }),
}));
