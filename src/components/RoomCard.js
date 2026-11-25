import React, { useState, useEffect, useRef } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { getStateColor } from '../utils/constants';

const RoomCard = React.memo(({
  room,
  stateName,
  mainStatus,
  subStatus,
  canControlMain = true,
  onToggleMain,
  onToggleSub
}) => {
  // Backend trả room là số phòng thực (201, 302...) — dùng trực tiếp
  const displayName = room.toString();

  // Optimistic local state — phản hồi ngay lập tức khi user bấm
  // Sẽ được đồng bộ lại từ prop khi socket trả dữ liệu thực từ PLC
  const [localMain, setLocalMain] = useState(mainStatus);
  const [localSub, setLocalSub] = useState(subStatus);

  // State loading để tránh spam click
  const [isTogglingMain, setIsTogglingMain] = useState(false);
  const [isTogglingSub, setIsTogglingSub] = useState(false);

  // Theo dõi xem có đang trong quá trình toggle không
  const pendingMain = useRef(false);
  const pendingSub = useRef(false);

  // Khi prop từ server thay đổi (sau khi PLC polling trả về),
  // chỉ cập nhật local state nếu không đang chờ phản hồi
  useEffect(() => {
    if (!pendingMain.current) setLocalMain(mainStatus);
  }, [mainStatus]);

  useEffect(() => {
    if (!pendingSub.current) setLocalSub(subStatus);
  }, [subStatus]);

  const bgColor = getStateColor(stateName).dashboard;

  const handleToggleMain = async (e) => {
    e.stopPropagation();
    if (isTogglingMain) return;
    const nextState = !localMain;
    // Optimistic update ngay lập tức
    setLocalMain(nextState);
    setIsTogglingMain(true);
    pendingMain.current = true;
    try {
      await onToggleMain(room, nextState);
    } catch {
      // Rollback nếu API lỗi
      setLocalMain(!nextState);
    } finally {
      pendingMain.current = false;
      setIsTogglingMain(false);
    }
  };

  const handleToggleSub = async (e) => {
    e.stopPropagation();
    if (isTogglingSub) return;
    const nextState = !localSub;
    // Optimistic update ngay lập tức
    setLocalSub(nextState);
    setIsTogglingSub(true);
    pendingSub.current = true;
    try {
      await onToggleSub(room, nextState);
    } catch {
      // Rollback nếu API lỗi
      setLocalSub(!nextState);
    } finally {
      pendingSub.current = false;
      setIsTogglingSub(false);
    }
  };

  return (
    <div className={`relative h-40 rounded-lg shadow-lg transition-all duration-300 text-white cursor-pointer hover:shadow-xl flex flex-col justify-between ${bgColor}`}>
      {/* Số phòng */}
      <div className="p-2 text-center flex items-center justify-center flex-1">
        <h3 className="text-3xl font-bold">{displayName}</h3>
      </div>

      {/* 2 Button Controls - dưới cùng */}
      <div className="p-2 flex gap-2">
        <button
          onClick={handleToggleMain}
          disabled={isTogglingMain || !canControlMain}
          title={canControlMain ? undefined : 'Chỉ quản trị viên được điều khiển relay chính'}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base flex justify-center items-center
            ${localMain ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
            ${isTogglingMain ? 'opacity-70 cursor-not-allowed' : !canControlMain ? 'cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95'}
            transition-all duration-200
          `}
        >
          {isTogglingMain ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Power className={`w-5 h-5 inline-block mr-2 ${localMain ? 'animate-pulse' : ''}`} />
          )}
          A
        </button>

        <button
          onClick={handleToggleSub}
          disabled={isTogglingSub}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-base flex justify-center items-center
            ${localSub ? 'bg-white/60 shadow-white/70' : 'bg-white/20 shadow-white/30'}
            ${isTogglingSub ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95'}
            transition-all duration-200
          `}
        >
          {isTogglingSub ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Power className={`w-5 h-5 inline-block mr-2 ${localSub ? 'animate-pulse' : ''}`} />
          )}
          B
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom compare: chỉ re-render khi các prop thực sự liên quan thay đổi
  return (
    prevProps.mainStatus === nextProps.mainStatus &&
    prevProps.subStatus === nextProps.subStatus &&
    prevProps.stateName === nextProps.stateName &&
    prevProps.room === nextProps.room &&
    prevProps.canControlMain === nextProps.canControlMain &&
    prevProps.onToggleMain === nextProps.onToggleMain &&
    prevProps.onToggleSub === nextProps.onToggleSub
  );
});

RoomCard.displayName = 'RoomCard';

export default RoomCard;
