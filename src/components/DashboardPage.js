import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import RoomCard from './RoomCard';

// Stat card configs — only 5 states
const STAT_CONFIGS = [
  { state: 'Trống',     bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
  { state: 'Chờ khách', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  { state: 'Có khách',  bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
  { state: 'Bật cưỡng bức', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { state: 'Bảo trì',   bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   dot: 'bg-gray-500' },
];

const DashboardPage = ({
  rooms,
  floors,
  canControlMainRelay,
  onToggleMain,
  onToggleSub,
  onRefresh
}) => {
  // Count rooms per state
  const stateCounts = useMemo(() => {
    const counts = {};
    rooms.forEach((r) => {
      const s = r.stateName || 'Không xác định';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  // Flat sorted room list
  const sortedRooms = useMemo(() => {
    return Object.keys(floors)
      .sort((a, b) => a - b)
      .flatMap((f) => floors[f]);
  }, [floors]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-800">Sơ đồ</h2>
        <button
          onClick={onRefresh}
          title="Làm mới"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 shadow-sm hover:bg-blue-100 hover:border-blue-300 transition-all flex-shrink-0 text-blue-700 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 py-3 sm:py-4 flex-1">
        {/* 5 stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 px-3 sm:px-4">
          {STAT_CONFIGS.map(({ state, bg, border, text, dot }) => (
            <div
              key={state}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${bg} ${border} shadow-sm`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
                <span className={`text-sm font-medium truncate ${text}`}>{state}</span>
              </div>
              <span className={`text-xl font-bold flex-shrink-0 ${text}`}>
                {stateCounts[state] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Room grid */}
        <div className="flex-1 px-3 sm:px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
            {sortedRooms.map((room) => (
              <RoomCard
                key={room.room}
                room={room.room}
                stateName={room.stateName || 'Không xác định'}
                mainStatus={room.mainStatus}
                subStatus={room.subStatus}
                canControlMain={canControlMainRelay}
                onToggleMain={onToggleMain}
                onToggleSub={onToggleSub}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
