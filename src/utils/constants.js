// ========================= Mapping trạng thái với màu sắc =========================
export const STATE_COLORS = {
  'Trống': { 
    dashboard: 'bg-green-500', 
    notif: { bg: 'bg-green-50', border: 'border-green-500', dot: 'bg-green-500', text: 'text-green-900' },
    hex: '#22c55e'
  },
  'Chờ khách': {
    dashboard: 'bg-blue-500', 
    notif: { bg: 'bg-blue-50', border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-900' },
    hex: '#3b82f6'
  },
  'Có khách': {
    dashboard: 'bg-red-500', 
    notif: { bg: 'bg-red-50', border: 'border-red-500', dot: 'bg-red-500', text: 'text-red-900' },
    hex: '#ef4444'
  },
  'Bật cưỡng bức': {
    dashboard: 'bg-yellow-500',
    notif: { bg: 'bg-yellow-50', border: 'border-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-900' },
    hex: '#eab308'
  },
  'Bảo trì': {
    dashboard: 'bg-gray-500', 
    notif: { bg: 'bg-gray-50', border: 'border-gray-500', dot: 'bg-gray-500', text: 'text-gray-900' },
    hex: '#6b7280'
  },
};

export const ROOM_STATES = [
  { name: 'Trống', description: 'Chưa có khách; điện chính và relay phụ đang tắt.' },
  { name: 'Chờ khách', description: 'Điện chính đã bật; cảm biến chưa phát hiện khách.' },
  { name: 'Có khách', description: 'Đã phát hiện khách; điện chính đang bật.' },
  { name: 'Bật cưỡng bức', description: 'Khách đang trong phòng và relay phụ được bật cưỡng bức.' },
  { name: 'Bảo trì', description: 'Tín hiệu phòng đang ở trạng thái bảo trì.' },
];

export const STATE_TRANSITION_DESCRIPTIONS = {
  'Trống-Có khách': 'Mở điện và phát hiện khách cùng lúc.',
  'Trống-Chờ khách': 'Mở điện trước khi phát hiện khách vào phòng.',
  'Chờ khách-Có khách': 'Phát hiện khách vào phòng.',
  'Có khách-Bật cưỡng bức': 'Bật relay phụ cưỡng bức khi khách đang trong phòng.',
  'Có khách-Chờ khách': 'Khách ra ngoài; điện chính vẫn bật.',
  'Bật cưỡng bức-Trống': 'Đóng điện sau trạng thái bật cưỡng bức.',
  'Có khách-Trống': 'Đóng điện và khách ra khỏi phòng.',
  'Chờ khách-Trống': 'Đóng điện khi chưa phát hiện khách.',
  'Trống-Bảo trì': 'Chuyển phòng sang chế độ bảo trì.',
};

export const getStateColor = (stateName) => {
  return STATE_COLORS[stateName] || {
    dashboard: 'bg-gray-500',
    notif: { bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400', text: 'text-gray-900' },
    hex: '#9ca3af'
  };
};
