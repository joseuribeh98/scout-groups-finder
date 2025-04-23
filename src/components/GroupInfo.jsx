import React from "react";
import {
  FiMapPin,
  FiClock,
  FiPhone,
  FiMail,
  FiGlobe,
  FiInstagram,
  FiFacebook,
} from "react-icons/fi";

// Orden oficial de las ramas
const RAMA_ORDER = ["Cachorros", "Manada", "Tropa", "Comunidad", "Clan"];

function GroupInfo({ group, onClose }) {
  // Función para formatear enlaces sociales
  const formatSocialLink = (url) => {
    if (!url || url === "N/A" || url === "") return null;
    if (!url.startsWith("http")) return `https://${url}`;
    return url;
  };

  // Iconos para cada red social
  const socialIcons = {
    instagram: <FiInstagram className="h-5 w-5 text-pink-600" />,
    facebook: <FiFacebook className="h-5 w-5 text-blue-600" />,
    web: <FiGlobe className="h-5 w-5 text-scout-purple" />,
  };

  // Ordenar las ramas según el orden oficial
  const orderedRamas = [...group.ramas].sort((a, b) => {
    return RAMA_ORDER.indexOf(a) - RAMA_ORDER.indexOf(b);
  });

  return (
    <div className="scout-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-scout-purple">{group.nombre}</h2>
        <span className="text-sm font-semibold bg-scout-light text-scout-purple px-2 py-1 rounded-full">
          #{group.id}
        </span>
      </div>

      <div className="border-b border-gray-200 pb-2 mb-4">
        <div className="text-sm text-gray-500">{group.ciudad}</div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start">
          <div className="min-w-8 mt-1 mr-3">
            <FiMapPin className="h-5 w-5 text-scout-blue" />
          </div>
          <span>{group.direccion}</span>
        </div>

        <div className="flex items-start">
          <div className="min-w-8 mt-1 mr-3">
            <FiClock className="h-5 w-5 text-scout-blue" />
          </div>
          <span>{group.horarios}</span>
        </div>

        <div className="flex items-start">
          <div className="min-w-8 mt-1 mr-3">
            <FiPhone className="h-5 w-5 text-scout-blue" />
          </div>
          <a
            href={`tel:${group.telefono}`}
            className="text-scout-purple hover:text-scout-dark"
          >
            {group.telefono}
          </a>
        </div>

        <div className="flex items-start">
          <div className="min-w-8 mt-1 mr-3">
            <FiMail className="h-5 w-5 text-scout-blue" />
          </div>
          <a
            href={`mailto:${group.email}`}
            className="text-scout-purple hover:text-scout-dark break-all"
          >
            {group.email}
          </a>
        </div>
      </div>

      {/* Sección de ramas activas */}
      <div className="border-t border-gray-200 pt-3 mb-4">
        <h3 className="font-medium text-scout-dark text-sm mb-2">
          Ramas activas
        </h3>
        <div className="flex flex-wrap gap-2">
          {orderedRamas.map((rama) => (
            <span
              key={rama}
              className="inline-block bg-scout-light text-scout-purple text-xs px-2 py-1 rounded-full"
            >
              {rama}
            </span>
          ))}
        </div>
      </div>

      {/* Redes sociales */}
      <div className="border-t border-gray-200 pt-3">
        <h3 className="font-medium text-scout-dark text-sm mb-2">
          Contacto y redes sociales
        </h3>
        <div className="flex flex-wrap gap-3">
          {formatSocialLink(group.instagram) && (
            <a
              href={formatSocialLink(group.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {socialIcons.instagram}
            </a>
          )}

          {formatSocialLink(group.facebook) && (
            <a
              href={formatSocialLink(group.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {socialIcons.facebook}
            </a>
          )}

          {formatSocialLink(group.sitioWeb) && (
            <a
              href={formatSocialLink(group.sitioWeb)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              {socialIcons.web}
            </a>
          )}
        </div>
      </div>

      <div className="flex mt-4 space-x-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${group.latitud},${group.longitud}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-scout-purple hover:bg-scout-dark text-white px-4 py-2 rounded-md transition-colors flex-1 flex justify-center items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Ver en Google Maps
        </a>

        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
import PropTypes from "prop-types";

GroupInfo.propTypes = {
  group: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    ciudad: PropTypes.string.isRequired,
    direccion: PropTypes.string.isRequired,
    horarios: PropTypes.string.isRequired,
    telefono: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    ramas: PropTypes.arrayOf(PropTypes.string).isRequired,
    instagram: PropTypes.string,
    facebook: PropTypes.string,
    sitioWeb: PropTypes.string,
    latitud: PropTypes.number.isRequired,
    longitud: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func,
};

export default GroupInfo;
