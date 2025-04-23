// src/components/GroupList.jsx
import React from "react";
import { FiMapPin, FiChevronRight } from "react-icons/fi";
import PropTypes from "prop-types";

function GroupList({ groups, onSelectGroup, selectedGroup }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-scout-blue text-white py-2 px-4">
        <h3 className="font-medium">Lista de Grupos Scout</h3>
      </div>

      <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No se encontraron grupos con los filtros actuales
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedGroup?.id === group.id
                  ? "bg-blue-50 border-l-4 border-scout-blue"
                  : ""
              }`}
              onClick={() => onSelectGroup(group)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-scout-blue">
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
          ))
        )}
      </div>
    </div>
  );
}
GroupList.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      ciudad: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onSelectGroup: PropTypes.func.isRequired,
  selectedGroup: PropTypes.shape({
    id: PropTypes.number,
  }),
};

export default GroupList;
