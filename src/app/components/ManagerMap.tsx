"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ManagerMapProps } from "@/src/interfaces/map";

const customIcon = new L.Icon({
	iconUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

function LocationMarker({
	position,
	setPosition,
}: {
	position: [number, number] | null;
	setPosition: (pos: [number, number]) => void;
}) {
	useMapEvents({
		click(e) {
			setPosition([e.latlng.lat, e.latlng.lng]);
		},
	});

	return position === null ? null : (
		<Marker position={position} icon={customIcon} />
	);
}
export default function ManagerMap({ lat, lng, onChange }: ManagerMapProps) {
	const markerPosition: [number, number] | null =
		lat && lng ? [parseFloat(lat), parseFloat(lng)] : null;
	const mapKey = lat && lng ? `${lat}-${lng}` : "initial-map";

	return (
		<div key={mapKey} className="w-full h-full">
			<MapContainer
				center={[45.6811, 28.6125]} // Болград
				zoom={14}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<LocationMarker
					position={markerPosition}
					setPosition={([clickedLat, clickedLng]) => {
						onChange(clickedLat.toFixed(6), clickedLng.toFixed(6));
					}}
				/>
			</MapContainer>
		</div>
	);
}
