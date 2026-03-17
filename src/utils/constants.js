// ========================= Mapping trạng thái với màu sắc =========================
export const STATE_COLORS = {
  'Trống': { 
    dashboard: 'bg-green-500', 
    notif: { bg: 'bg-green-50', border: 'border-green-500', dot: 'bg-green-500', text: 'text-green-900' },
    hex: '#22c55e'
  },
  'Check-in': { 
    dashboard: 'bg-blue-500', 
    notif: { bg: 'bg-blue-50', border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-900' },
    hex: '#3b82f6'
  },
  'Vào phòng': { 
    dashboard: 'bg-red-500', 
    notif: { bg: 'bg-red-50', border: 'border-red-500', dot: 'bg-red-500', text: 'text-red-900' },
    hex: '#ef4444'
  },
  'Dùng thẻ': { 
    dashboard: 'bg-yellow-500', 
    notif: { bg: 'bg-yellow-50', border: 'border-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-900' },
    hex: '#eab308'
  },
  'Sửa chữa': { 
    dashboard: 'bg-gray-500', 
    notif: { bg: 'bg-gray-50', border: 'border-gray-500', dot: 'bg-gray-500', text: 'text-gray-900' },
    hex: '#6b7280'
  },
};

export const getStateColor = (stateName) => {
  return STATE_COLORS[stateName] || {
    dashboard: 'bg-gray-500',
    notif: { bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400', text: 'text-gray-900' },
    hex: '#9ca3af'
  };
};
