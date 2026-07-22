export const formatUkrainianPhoneNumber = (value: string): string => {
	if (!value) return "";

	let digits = value.replace(/\D/g, "");
	if (!digits) return "";

	if (digits.startsWith("380")) {
		digits = digits.slice(3);
	} else if (digits.startsWith("38")) {
		digits = digits.slice(2);
	}

	if (digits.startsWith("0")) {
		digits = digits.slice(1);
	}

	digits = digits.slice(0, 9);

	let formatted = "+380";

	if (digits.length > 0) {
		formatted += ` (${digits.slice(0, 2)}`;
	}
	if (digits.length > 2) {
		formatted += `) ${digits.slice(2, 5)}`;
	}
	if (digits.length > 5) {
		formatted += `-${digits.slice(5, 7)}`;
	}
	if (digits.length > 7) {
		formatted += `-${digits.slice(7, 9)}`;
	}

	return formatted;
};