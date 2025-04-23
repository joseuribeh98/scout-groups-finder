import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Solucionar problema de iconos en React Leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componente para actualizar la vista del mapa basado en grupos o grupo seleccionado
function MapUpdater({ groups, selectedGroup }) {
  const map = useMap();

  // Invalidar tamaño del mapa cuando cambia la selección
  useEffect(() => {
    // Pequeño retraso para permitir que el DOM se actualice
    const timeoutId = setTimeout(() => {
      map.invalidateSize();

      if (selectedGroup) {
        // Centrar en el grupo seleccionado
        map.setView([selectedGroup.latitud, selectedGroup.longitud], 15, {
          animate: true,
        });
      } else if (groups.length > 0) {
        // Si no hay grupo seleccionado, mostrar todos los grupos
        const bounds = L.latLngBounds(
          groups.map((group) => [group.latitud, group.longitud]),
        );
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
        });
      } else {
        // Si no hay grupos, centrar en Valle del Cauca
        map.setView([3.8, -76.5], 9, { animate: true });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedGroup, groups, map]);

  return null;
}

function Map({ groups, onSelectGroup, selectedGroup }) {
  // Centro inicial del Valle del Cauca
  const position = [3.8, -76.5];

  return (
    <MapContainer
      center={position}
      zoom={9}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
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
            <div className="px-1 py-1">
              <div className="font-medium text-scout-purple text-center">
                {group.nombre}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {group.direccion}
              </div>
              <button
                onClick={() => onSelectGroup(group)}
                className="mt-2 w-full text-xs bg-scout-purple text-white py-1 px-2 rounded hover:bg-opacity-90"
              >
                Ver detalles
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Componente que actualiza la vista del mapa */}
      <MapUpdater groups={groups} selectedGroup={selectedGroup} />
    </MapContainer>
  );
}
MapUpdater.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      latitud: PropTypes.number.isRequired,
      longitud: PropTypes.number.isRequired,
      nombre: PropTypes.string,
      direccion: PropTypes.string,
    }),
  ).isRequired,
  selectedGroup: PropTypes.shape({
    id: PropTypes.number,
    latitud: PropTypes.number,
    longitud: PropTypes.number,
    nombre: PropTypes.string,
    direccion: PropTypes.string,
  }),
};

Map.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      latitud: PropTypes.number.isRequired,
      longitud: PropTypes.number.isRequired,
      nombre: PropTypes.string,
      direccion: PropTypes.string,
    }),
  ).isRequired,
  onSelectGroup: PropTypes.func.isRequired,
  selectedGroup: PropTypes.shape({
    id: PropTypes.number,
    latitud: PropTypes.number,
    longitud: PropTypes.number,
    nombre: PropTypes.string,
    direccion: PropTypes.string,
  }),
};

export default Map;
