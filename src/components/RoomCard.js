import React, { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { ROOM_NAMES, getStateColor } from '../utils/constants';

const RoomCard = ({ room, stateName, mainStatus, subStatus, onToggleMain, onToggleSub }) => {
  const displayName = ROOM_NAMES[room] || room;
  
  // State quản lý việc loading của từng nút để tránh spam click
  const [isTogglingMain, setIsTogglingMain] = useState(false);
  const [isTogglingSub, setIsTogglingSub] = useState(false);

  // Chọn màu sắc dựa trên stateName
  const getStateBackgroundColor = () => {
    return getStateColor(stateName).dashboard;
  };

  const handleToggleMain = async (e) => {
    e.stopPropagation();
    if (isTogglingMain) return;
    setIsTogglingMain(true);
    try {
      await onToggleMain(room, !mainStatus);
    } finally {
      setIsTogglingMain(false);
    }
  };

  const handleToggleSub = async (e) => {
    e.stopPropagation();
    if (isTogglingSub) return;
    setIsTogglingSub(true);
    try {
      await onToggleSub(room, !subStatus);
    } finally {
      setIsTogglingSub(false);
    }
  };

  return (
    <div className={`relative h-40 rounded-lg shadow-lg transition-all duration-300 text-white cursor-pointer hover:shadow-xl flex flex-col justify-between ${getStateBackgroundColor()}`}>
      {/* Số phòng */}
      <div className="p-2 text-center flex items-center justify-center flex-1">
        <h3 className="text-3xl font-bold">{displayName}</h3>
      </div>

      {/* 2 Button Controls - dưới cùng */}
      <div className="p-2 flex gap-2">
        <button
          onClick={handleToggleMain}
          disabled={isTogglingMain}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base flex justify-center items-center
            ${mainStatus ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
            ${isTogglingMain ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95'}
            transition-all duration-200
          `}
        >
          {isTogglingMain ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Power className={`w-5 h-5 inline-block mr-2 ${mainStatus ? 'animate-pulse' : ''}`} />
          )}
          A
        </button>

        <button
          onClick={handleToggleSub}
          disabled={isTogglingSub}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base flex justify-center items-center
            ${subStatus ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
             ${isTogglingSub ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95'}
             transition-all duration-200
          `}
        >
          {isTogglingSub ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Power className={`w-5 h-5 inline-block mr-2 ${subStatus ? 'animate-pulse' : ''}`} />
          )}
          B
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
