import { useState, useEffect } from 'react';
import Map from './components/Map';
import GroupInfo from './components/GroupInfo';
import gruposData from './data/grupos.json';

function App() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    setGroups(gruposData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-scout-blue text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Grupos Scout del Valle del Cauca
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="scout-card h-[600px] overflow-hidden">
              <Map
                groups={groups}
                onSelectGroup={setSelectedGroup}
              />
            </div>
          </div>

          <div>
            {selectedGroup ? (
              <GroupInfo group={selectedGroup} />
            ) : (
              <div className="scout-card bg-scout-green bg-opacity-10 flex items-center justify-center h-full">
                <p className="text-center text-scout-green p-8">
                  Selecciona un grupo scout en el mapa para ver su información
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-4 mt-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Scouts Valle del Cauca
        </div>
      </footer>
    </div>
  );
}

export default App;