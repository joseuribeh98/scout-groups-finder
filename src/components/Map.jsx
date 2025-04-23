import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Solucionar problema de iconos en React Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function Map({ groups, onSelectGroup }) {
    // Centro del Valle del Cauca (aproximadamente)
    const position = [3.8, -76.5];

    return (
        <MapContainer
            center={position}
            zoom={9}
            className="h-full w-full"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {groups.map((group) => (
                <Marker
                    key={group.id}
                    position={[group.latitud, group.longitud]}
                    eventHandlers={{
                        click: () => {
                            onSelectGroup(group);
                        },
                    }}
                >
                    <Popup className="scout-popup">
                        <div className="text-center font-medium text-scout-blue">
                            {group.nombre}
                        </div>
                        <div className="text-sm text-gray-600">
                            {group.direccion}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default Map;