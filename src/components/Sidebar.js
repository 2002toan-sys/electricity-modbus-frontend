import React from 'react';
import {
  LayoutDashboard,
  Bell,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  BookOpen,
  Settings,
} from 'lucide-react';
import GUIDE_NAVIGATION from '../utils/guideNavigation';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Sơ đồ', icon: LayoutDashboard },
  { id: 'history', label: 'Lịch sử', icon: History },
  { id: 'guide', label: 'Hướng dẫn', icon: BookOpen },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'settings', label: 'Cài đặt', icon: Settings, adminOnly: true },
];

const Sidebar = ({
  activePage,
  onNavigate,
  connected,
  onRefresh,
  onLogout,
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  unreadCount,
}) => {
  const sidebarContent = (isMobileDrawer = false) => {
    const showLabels = !collapsed || isMobileDrawer;
    const navItems = NAV_ITEMS.filter(({ adminOnly }) => !adminOnly || user?.role === 'admin');

    return (
      <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700">

        {/* ===== TOP: Logo + Toggle ===== */}
        {showLabels ? (
          /* Expanded: horizontal row */
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-bold text-slate-800 leading-tight uppercase tracking-wide whitespace-nowrap">
                Viet Phuong Center Hotel
              </h1>
              <p className="text-[11px] text-slate-400 whitespace-nowrap">Hệ thống điều khiển điện</p>
            </div>
            {/* Desktop collapse button */}
            {!isMobileDrawer && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Thu nhỏ"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
            )}
            {/* Mobile close */}
            {isMobileDrawer && (
              <button
                onClick={onMobileClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        ) : (
          /* Collapsed: vertical stack — icon then expand button */
          <div className="flex flex-col items-center pt-3 pb-2 border-b border-slate-100 gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
              title="Mở rộng"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* ===== CONNECTION STATUS ===== */}
        <div className={`px-3 py-3 border-b border-slate-100 flex items-center justify-center`}>
          {/* Dot + label (Status Pill) */}
          <div
            className={`flex items-center gap-2 flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border shadow-sm transition-all ${
              connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            } ${!showLabels ? 'justify-center' : ''}`}
            title={connected ? 'Đã kết nối' : 'Mất kết nối'}
          >
            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {showLabels && (
              <span className={`text-xs font-bold truncate ${connected ? 'text-green-700' : 'text-red-700'}`}>
                {connected ? 'Đã kết nối' : 'Mất kết nối'}
              </span>
            )}
          </div>
        </div>

        {/* ===== NAVIGATION TABS ===== */}
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id;
            const showBadge = id === 'notifications' && unreadCount > 0;
            return (
              <div key={id} className="group relative">
                <button
                  onClick={() => {
                    onNavigate(id);
                    if (isMobileDrawer) onMobileClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }
                    ${!showLabels ? 'justify-center' : ''}
                  `}
                  title={!showLabels ? label : undefined}
                  aria-haspopup={id === 'guide' ? 'true' : undefined}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {showBadge && !showLabels && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                  {showLabels && (
                    <>
                      <span className="flex-1 text-left text-sm">{label}</span>
                      {showBadge && (
                        <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
                {id === 'guide' && showLabels && (
                  <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                    <nav
                      aria-label="Điều hướng hướng dẫn"
                      className="min-h-0 overflow-hidden"
                    >
                      <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-2">
                        {GUIDE_NAVIGATION.map(({ id: sectionId, label: sectionLabel, level }) => (
                          <a
                            key={sectionId}
                            href={`#${sectionId}`}
                            onClick={(event) => {
                              event.preventDefault();
                              onNavigate('guide');
                              window.history.replaceState(
                                null,
                                '',
                                `${window.location.pathname}${window.location.search}#${sectionId}`
                              );
                              if (activePage === 'guide') {
                                document.getElementById(sectionId)?.scrollIntoView?.({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              }
                              if (isMobileDrawer) onMobileClose();
                            }}
                            className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-blue-50 hover:text-blue-800 ${
                              level === 2
                                ? 'bg-slate-50 font-semibold text-slate-800'
                                : 'ml-2 text-slate-600'
                            }`}
                          >
                            {sectionLabel}
                          </a>
                        ))}
                      </div>
                    </nav>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ===== BOTTOM: USER + LOGOUT ===== */}
        <div className="border-t border-slate-100 px-2 py-3 space-y-1">
          {showLabels ? (
            <button
              type="button"
              onClick={() => {
                onNavigate('changePassword');
                if (isMobileDrawer) onMobileClose();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                activePage === 'changePassword'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
              title="Đổi mật khẩu"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-700 truncate">{user?.username}</div>
                <div className="text-xs text-blue-500 uppercase tracking-wide truncate">{user?.role}</div>
              </div>
            </button>
          ) : (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={() => onNavigate('changePassword')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activePage === 'changePassword'
                    ? 'bg-blue-50'
                    : 'hover:bg-slate-100'
                }`}
                title="Đổi mật khẩu"
                aria-label={`Hồ sơ ${user?.username}; đổi mật khẩu`}
              >
                <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </button>
            </div>
          )}

          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all font-medium text-sm ${!showLabels ? 'justify-center' : ''}`}
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {showLabels && <span>Đăng xuất</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen transition-all duration-300 ease-in-out ${collapsed ? 'w-14' : 'w-72'}`}
      >
        {sidebarContent(false)}
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden">
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
