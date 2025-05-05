import React, { useState, useEffect, useMemo } from "react";
import Map from "./components/Map";
import GroupInfo from "./components/GroupInfo";
import {
  FiSearch,
  FiMapPin,
  FiChevronRight,
  FiX,
  FiFilter,
} from "react-icons/fi";

// Orden oficial de las ramas
const RAMA_ORDER = ["Cachorros", "Manada", "Tropa", "Comunidad", "Clan"];

function App() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRamas, setSelectedRamas] = useState({});

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response = await fetch("./grupos.json");
        if (!response.ok) throw new Error("Error al cargar los datos");
        const data = await response.json();
        setGroups(data);

        // Inicializar selectedRamas con todas las ramas posibles
        const allRamas = new Set();
        data.forEach((group) => {
          group.ramas.forEach((rama) => allRamas.add(rama));
        });

        const initialRamas = {};
        RAMA_ORDER.forEach((rama) => {
          if (allRamas.has(rama)) {
            initialRamas[rama] = false;
          }
        });

        setSelectedRamas(initialRamas);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchGrupos();
  }, []);

  // Extraer lista única de ciudades
  const cities = useMemo(() => {
    const citySet = new Set(groups.map((group) => group.ciudad));
    return ["Todas", ...Array.from(citySet)].sort();
  }, [groups]);

  // Obtener lista de ramas disponibles en el orden correcto
  const ramasList = useMemo(() => {
    const availableRamas = Object.keys(selectedRamas);
    return RAMA_ORDER.filter((rama) => availableRamas.includes(rama));
  }, [selectedRamas]);

  // Verificar si alguna rama está seleccionada
  const hasActiveRamaFilters = useMemo(() => {
    return Object.values(selectedRamas).some((value) => value === true);
  }, [selectedRamas]);

  // Cambiar el estado de una rama específica
  const handleRamaChange = (rama) => {
    setSelectedRamas((prev) => ({
      ...prev,
      [rama]: !prev[rama],
    }));
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCity("");

    // Restablecer todas las ramas a false
    const resetRamas = {};
    Object.keys(selectedRamas).forEach((rama) => {
      resetRamas[rama] = false;
    });
    setSelectedRamas(resetRamas);
  };

  // Filtrar grupos basado en búsqueda, ciudad y ramas
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Filtro por término de búsqueda
      const matchesSearch =
        group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.id.toString().includes(searchTerm.toLowerCase());

      // Filtro por ciudad
      const matchesCity =
        selectedCity === "" ||
        selectedCity === "Todas" ||
        group.ciudad === selectedCity;

      // Filtro por ramas
      let matchesRamas = true;
      if (hasActiveRamaFilters) {
        matchesRamas = group.ramas.some((rama) => selectedRamas[rama]);
      }

      return matchesSearch && matchesCity && matchesRamas;
    });
  }, [groups, searchTerm, selectedCity, selectedRamas, hasActiveRamaFilters]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scout-purple mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando grupos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          Error al cargar los datos: {error}
        </div>
      )}

      <header className="bg-scout-purple text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Grupos Scout del Valle del Cauca
          </h1>
          <p className="text-center text-blue-100 mt-1">
            Encuentra información de contacto y ubicación
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-scout-purple focus:border-scout-purple sm:text-sm"
                placeholder="Buscar por nombre o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-scout-purple focus:border-scout-purple sm:text-sm rounded-md"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">Todas las ciudades</option>
                {cities
                  .filter((city) => city !== "Todas")
                  .map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center py-2 px-4 border rounded-md transition-colors h-10 ${
                hasActiveRamaFilters
                  ? "bg-scout-purple text-white border-scout-purple"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FiFilter className="mr-2" />
              Ramas
              {hasActiveRamaFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-scout-purple">
                  {Object.values(selectedRamas).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filtros de ramas (expandible) */}
          {showFilters && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Filtrar por ramas
                </h3>
                <button
                  onClick={() => {
                    const resetRamas = {};
                    Object.keys(selectedRamas).forEach((rama) => {
                      resetRamas[rama] = false;
                    });
                    setSelectedRamas(resetRamas);
                  }}
                  className="text-xs text-scout-purple hover:text-scout-dark"
                  disabled={!hasActiveRamaFilters}
                >
                  Limpiar ramas
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-2">
                {ramasList.map((rama) => (
                  <label key={rama} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-scout-purple focus:ring-scout-purple"
                      checked={selectedRamas[rama]}
                      onChange={() => handleRamaChange(rama)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{rama}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredGroups.length}{" "}
              {filteredGroups.length === 1
                ? "grupo encontrado"
                : "grupos encontrados"}
            </p>

            {(searchTerm || selectedCity || hasActiveRamaFilters) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-scout-purple hover:text-scout-dark"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </div>

        {/* Diseño integrado con mapa y lista */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Parte izquierda: Lista de grupos */}
          <div className="lg:col-span-1 h-[calc(100vh-300px)] flex flex-col">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
              <div className="bg-scout-purple text-white py-2 px-4 flex items-center justify-between">
                <h3 className="font-medium">Grupos Scout</h3>
                {selectedGroup && (
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-white hover:text-blue-200"
                    title="Deseleccionar grupo"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <div className="flex-grow overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron grupos con los filtros actuales
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedGroup?.id === group.id
                            ? "bg-scout-light border-l-4 border-scout-purple"
                            : ""
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-scout-dark">
                              {group.nombre}
                              <span className="ml-2 text-xs font-normal text-gray-600">
                                #{group.id}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <FiMapPin className="h-3 w-3 mr-1" />
                              {group.ciudad}
                            </div>
                          </div>
                          <FiChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parte derecha: Combinación de mapa y detalles */}
          <div className="lg:col-span-3 flex flex-col h-[calc(100vh-300px)]">
            {/* Mapa en la parte superior */}
            <div className="flex-grow scout-card overflow-hidden mb-4">
              <Map
                groups={filteredGroups}
                onSelectGroup={setSelectedGroup}
                selectedGroup={selectedGroup}
              />
            </div>

            {/* Detalles del grupo seleccionado (si hay uno) */}
            {selectedGroup && (
              <div className="scout-card mt-4 overflow-y-auto max-h-[300px] relative">
                {/* Botón para cerrar la información */}
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-1 transition-colors"
                  title="Cerrar información"
                >
                  <FiX className="h-5 w-5" />
                </button>
                <GroupInfo
                  group={selectedGroup}
                  onClose={() => setSelectedGroup(null)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-4 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Asociación Scouts de Colombia - Región
          Valle del Cauca | Creado por{" "}
          <a
            href="https://github.com/joseuribeh98/"
            className="text-scout-purple hover:text-scout-dark"
          >
            Jose Uribe
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
