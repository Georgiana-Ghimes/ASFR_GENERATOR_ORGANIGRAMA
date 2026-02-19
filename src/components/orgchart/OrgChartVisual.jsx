import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

const unitColors = {
  director_general: { bg: '#22c55e', text: '#000000', border: '#16a34a' },
  directie: { bg: '#ec4899', text: '#000000', border: '#db2777' },
  serviciu: { bg: '#fbbf24', text: '#000000', border: '#d97706' },
  compartiment: { bg: '#ffffff', text: '#000000', border: '#6b7280' },
  inspectorat: { bg: '#3b82f6', text: '#000000', border: '#2563eb' },
  birou: { bg: '#a855f7', text: '#000000', border: '#9333ea' },
};

// Special colors for specific units
const specialColors = {
  '1100': { bg: '#f472b6', border: '#ec4899' }, // Directia Economica - pink
  '1200': { bg: '#c084fc', border: '#a855f7' }, // Departament Certificari - purple
  '2000': { bg: '#60a5fa', border: '#3b82f6' }, // Directia Inspectorate - blue
  '3000': { bg: '#fbbf24', border: '#d97706' }, // Directia Licentiere - yellow/orange
};

function UnitBox({ unit, onClick, isVertical = false, width = 'auto' }) {
  const baseColors = unitColors[unit.unit_type] || unitColors.compartiment;
  const special = specialColors[unit.stas_code];
  const colors = special ? { ...baseColors, ...special } : baseColors;
  
  const boxStyle = {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    color: '#000000',
    minWidth: isVertical ? '40px' : '110px',
    maxWidth: isVertical ? '45px' : width === 'auto' ? '150px' : width,
  };

  if (isVertical) {
    return (
      <div 
        className="border-2 cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
        style={boxStyle}
        onClick={() => onClick?.(unit)}
      >
        {/* Header */}
        <div className="flex text-[8px] border-b" style={{ borderColor: colors.border }}>
          <div className="px-0.5 py-0.5 border-r font-mono font-bold flex-1 text-center" style={{ borderColor: colors.border }}>
            {unit.stas_code}
          </div>
        </div>
        <div className="flex text-[8px] border-b" style={{ borderColor: colors.border }}>
          <div className="px-0.5 py-0.5 border-r text-center flex-1" style={{ borderColor: colors.border }}>
            {unit.management_positions || 0}
          </div>
        </div>
        <div className="flex text-[8px] border-b" style={{ borderColor: colors.border }}>
          <div className="px-0.5 py-0.5 text-center flex-1">
            {unit.total_positions || 0}
          </div>
        </div>
        {/* Vertical text */}
        <div 
          className="flex-1 flex items-center justify-center p-1"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            minHeight: '120px',
          }}
        >
          <span className="text-[7px] font-semibold text-center leading-tight">
            {unit.name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="border-2 cursor-pointer hover:shadow-lg transition-shadow"
      style={boxStyle}
      onClick={() => onClick?.(unit)}
    >
      {/* Header row */}
      <div className="flex text-[8px] border-b" style={{ borderColor: colors.border }}>
        <div className="px-1 py-0.5 border-r font-mono font-bold" style={{ borderColor: colors.border, minWidth: '28px' }}>
          {unit.stas_code}
        </div>
        <div className="px-1 py-0.5 border-r text-center" style={{ borderColor: colors.border, minWidth: '16px' }}>
          {unit.management_positions || 0}
        </div>
        <div className="px-1 py-0.5 text-center flex-1" style={{ minWidth: '16px' }}>
          {unit.total_positions || 0}
        </div>
      </div>
      {/* Name */}
      <div className="px-1 py-1 text-[7px] font-semibold leading-tight text-center">
        {unit.name}
      </div>
    </div>
  );
}

function VerticalConnector({ height = 16 }) {
  return <div className="w-px bg-gray-500 mx-auto" style={{ height: `${height}px` }}></div>;
}

function HorizontalConnector({ width = 8 }) {
  return <div className="h-px bg-gray-500" style={{ width: `${width}px` }}></div>;
}

export default function OrgChartVisual({ units, onSelectUnit }) {
  const getUnit = (code) => units.find(u => u.stas_code === code);
  const getChildren = (parentId) => units.filter(u => u.parent_unit_id === parentId)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const directorGeneral = getUnit('100');
  const consiliu = getUnit('330');
  
  // Top level compartimente (direct to DG)
  const auditIntern = getUnit('1001');
  const consilier = getUnit('1002');
  const ssmSu = getUnit('1003');
  
  // Servicii directe sub DG
  const servControl = getUnit('1040');
  const servComunicare = getUnit('1010');
  const servJuridic = getUnit('1020');
  const servRU = getUnit('1030');
  
  // Directii
  const dirEconomica = getUnit('1100');
  const deptCertificari = getUnit('1200');
  const dirInspectorate = getUnit('2000');
  const dirLicente = getUnit('3000');

  return (
    <div 
      className="p-4 overflow-auto relative" 
      style={{ 
        minWidth: '1400px', 
        minHeight: '900px',
        backgroundColor: '#ffffff',
        backgroundImage: `
          linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0'
      }}
    >
      {/* Header central - deasupra tuturor */}
      <div className="text-center text-[10px] mb-3 text-gray-900 relative z-10 bg-white inline-block w-full">
        <div className="font-bold">AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR</div>
        <div>CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026</div>
      </div>

      {/* Vertical separator line - starts from header, extends through entire height - BEHIND everything */}
      <div className="absolute w-px bg-gray-500 left-1/2 z-0" style={{ transform: 'translateX(-50%)', top: '60px', bottom: '0' }}></div>

      <div className="flex relative z-10">
        {/* Left section - Legend + Directii */}
        <div className="flex-1">
          {/* Legend - stânga sus - FIXED on top of grid */}
          <div className="text-[9px] border-2 border-gray-800 p-2 bg-gray-50 inline-block mb-4 relative z-10">
            <div className="font-bold mb-1">TOTAL POSTURI: 230</div>
            <div className="mb-1">Funcții de conducere: 18</div>
            <div className="ml-2">- Director general: 1</div>
            <div className="ml-2">- Director: 3</div>
            <div className="ml-2">- Șef departament: 1</div>
            <div className="ml-2">- Inspector șef teritorial: 5</div>
            <div className="ml-2">- Șef serviciu: 8</div>
            <div className="mt-1">Posturi de execuție: 212</div>
          </div>

          {/* Consiliul de Conducere - ÎNTOTDEAUNA VIZIBIL */}
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-800 bg-white px-6 py-2 shadow-md">
              <div className="text-center font-bold text-base">
                CONSILIUL DE CONDUCERE
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <VerticalConnector height={20} />
          </div>

          {!directorGeneral ? (
            <div className="p-8 text-center text-gray-500">
              Nu există structură organizațională. Adaugă unități pentru a construi organigrama.
            </div>
          ) : (
            <div className="flex gap-2 items-start">
              {/* Directia Economica */}
              {dirEconomica && (
                <div className="flex flex-col items-center">
                  <UnitBox unit={dirEconomica} onClick={onSelectUnit} isVertical />
                  <VerticalConnector height={8} />
                  <div className="flex">
                    {/* Left compartimente */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      {getUnit('1101') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('1101')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                      {getUnit('1102') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('1102')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                      {getUnit('1103') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('1103')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                    </div>
                    <div className="w-px bg-gray-500 self-stretch"></div>
                    {/* Right serviciu */}
                    <div className="flex flex-col gap-0.5 ml-1">
                      {getUnit('1110') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('1110')} onClick={onSelectUnit} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Departament Certificari */}
              {deptCertificari && (
                <div className="flex flex-col items-center">
                  <UnitBox unit={deptCertificari} onClick={onSelectUnit} isVertical />
                  <VerticalConnector height={8} />
                  <div className="flex flex-col gap-0.5">
                    {getUnit('1210') && (
                      <div className="flex items-center">
                        <HorizontalConnector />
                        <UnitBox unit={getUnit('1210')} onClick={onSelectUnit} />
                      </div>
                    )}
                    {getUnit('1220') && (
                      <div className="flex items-center">
                        <HorizontalConnector />
                        <UnitBox unit={getUnit('1220')} onClick={onSelectUnit} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Directia Inspectorate */}
              {dirInspectorate && (
                <div className="flex flex-col items-center">
                  <UnitBox unit={dirInspectorate} onClick={onSelectUnit} isVertical />
                  <VerticalConnector height={8} />
                  <div className="flex">
                    {/* Left compartimente */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      {getUnit('2001') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('2001')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                      {getUnit('2091') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('2091')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                      {getUnit('2061') && (
                        <div className="flex items-center">
                          <UnitBox unit={getUnit('2061')} onClick={onSelectUnit} />
                          <HorizontalConnector />
                        </div>
                      )}
                    </div>
                    <div className="w-px bg-gray-500 self-stretch"></div>
                    {/* Right inspectorate */}
                    <div className="flex flex-col gap-0.5 ml-1">
                      {getUnit('2010') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2010')} onClick={onSelectUnit} />
                        </div>
                      )}
                      {getUnit('2020') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2020')} onClick={onSelectUnit} />
                        </div>
                      )}
                      {getUnit('2030') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2030')} onClick={onSelectUnit} />
                        </div>
                      )}
                      {getUnit('2040') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2040')} onClick={onSelectUnit} />
                        </div>
                      )}
                      {getUnit('2050') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2050')} onClick={onSelectUnit} />
                        </div>
                      )}
                      {getUnit('2060') && (
                        <div className="flex items-center">
                          <HorizontalConnector />
                          <UnitBox unit={getUnit('2060')} onClick={onSelectUnit} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Directia Licente */}
              {dirLicente && (
                <div className="flex flex-col items-center">
                  <UnitBox unit={dirLicente} onClick={onSelectUnit} isVertical />
                  <VerticalConnector height={8} />
                  <div className="flex flex-col gap-0.5">
                    {getUnit('3001') && (
                      <div className="flex items-center">
                        <UnitBox unit={getUnit('3001')} onClick={onSelectUnit} />
                        <HorizontalConnector />
                      </div>
                    )}
                    {getUnit('3002') && (
                      <div className="flex items-center">
                        <UnitBox unit={getUnit('3002')} onClick={onSelectUnit} />
                        <HorizontalConnector />
                      </div>
                    )}
                    {getUnit('3003') && (
                      <div className="flex items-center">
                        <UnitBox unit={getUnit('3003')} onClick={onSelectUnit} />
                        <HorizontalConnector />
                      </div>
                    )}
                    {getUnit('3004') && (
                      <div className="flex items-center">
                        <UnitBox unit={getUnit('3004')} onClick={onSelectUnit} />
                        <HorizontalConnector />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right section - Director + Services */}
        <div className="flex-1">
          {/* Director - dreapta sus - FIXED on top of grid */}
          <div className="text-right text-[10px] text-gray-900 mb-4 relative z-10">
            <div className="font-bold">DIRECTOR GENERAL</div>
            <div>Petru BOGDAN</div>
          </div>

          {directorGeneral && (
            <div className="flex flex-col items-start ml-4">
              {/* Top row with compartimente */}
              <div className="flex gap-1 mb-1 items-end">
                {auditIntern && <UnitBox unit={auditIntern} onClick={onSelectUnit} />}
                {consilier && <UnitBox unit={consilier} onClick={onSelectUnit} />}
                {ssmSu && <UnitBox unit={ssmSu} onClick={onSelectUnit} />}
              </div>

              {/* Servicii row */}
              <div className="flex gap-1 mb-2">
                {servControl && (
                  <div className="flex flex-col items-center">
                    <UnitBox unit={servControl} onClick={onSelectUnit} />
                    <VerticalConnector height={4} />
                    <div className="flex flex-col gap-0.5">
                      {getUnit('1052') && <UnitBox unit={getUnit('1052')} onClick={onSelectUnit} />}
                      {getUnit('1051') && <UnitBox unit={getUnit('1051')} onClick={onSelectUnit} />}
                    </div>
                  </div>
                )}
                {servComunicare && (
                  <div className="flex flex-col items-center">
                    <UnitBox unit={servComunicare} onClick={onSelectUnit} />
                    <VerticalConnector height={4} />
                    <div className="flex flex-col gap-0.5">
                      {getUnit('1013') && <UnitBox unit={getUnit('1013')} onClick={onSelectUnit} />}
                      {getUnit('1011') && <UnitBox unit={getUnit('1011')} onClick={onSelectUnit} />}
                    </div>
                  </div>
                )}
                {servJuridic && (
                  <div className="flex flex-col items-center">
                    <UnitBox unit={servJuridic} onClick={onSelectUnit} />
                    <VerticalConnector height={4} />
                    <div className="flex flex-col gap-0.5">
                      {getUnit('1022') && <UnitBox unit={getUnit('1022')} onClick={onSelectUnit} />}
                      {getUnit('1021') && <UnitBox unit={getUnit('1021')} onClick={onSelectUnit} />}
                    </div>
                  </div>
                )}
                {servRU && <UnitBox unit={servRU} onClick={onSelectUnit} />}
              </div>

              {/* Director General */}
              <div className="flex items-center gap-2 mb-2">
                <UnitBox unit={directorGeneral} onClick={onSelectUnit} />
                <HorizontalConnector width={16} />
              </div>

              {/* Consiliu */}
              {consiliu && (
                <div className="mt-2">
                  <UnitBox unit={consiliu} onClick={onSelectUnit} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
