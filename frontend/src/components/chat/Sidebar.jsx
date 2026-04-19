// src/components/chat/Sidebar.jsx
import { useState, useEffect } from "react";
import useChatStore from "../../context/chatStore";
import useAuthStore from "../../context/authStore";
import useDarkMode from "../../hooks/useDarkMode";
import Avatar from "../ui/Avatar";
import { getDMName, getDMAvatar, formatChatDate, truncate, isUserOnline } from "../../utils/helpers";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

export default function Sidebar({ onRoomSelect, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuthStore();
  const { rooms, activeRoom, fetchRooms, openDM, createGroup, onlineUsers, unreadCounts } = useChatStore();
  const [dark, setDark] = useDarkMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tab, setTab] = useState("chats"); // "chats" | "people"

  useEffect(() => { fetchRooms(); }, []);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(data.users);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load all users for people tab
  useEffect(() => {
    if (tab === "people") {
      api.get("/users").then(({ data }) => setAllUsers(data.users));
    }
  }, [tab]);

  const handleDM = async (userId) => {
    setSearchQuery("");
    setSearchResults([]);
    await openDM(userId, user._id);
    setMobileOpen(false);
  };

  const handleGroupCreate = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) {
      return toast.error("Group name and at least 1 other member required.");
    }
    const result = await createGroup(groupName, selectedUsers.map(u => u._id), groupDesc);
    if (result.success) {
      toast.success("Group created!");
      setShowNewGroup(false);
      setGroupName(""); setGroupDesc(""); setSelectedUsers([]);
      onRoomSelect(result.room);
      setMobileOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const name = getDMName(r, user._id);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-80 flex flex-col
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-bold text-xl text-gray-900 dark:text-white">Nexus</span>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="Toggle dark mode"
            >
              {dark ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
            </button>
            {/* New group button */}
            <button
              onClick={() => setShowNewGroup(!showNewGroup)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="New group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            </button>
            {/* Logout */}
            <button
              onClick={() => { logout(); }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Current user */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
          <Avatar user={user} size="sm" showOnline isOnline />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username}</p>
            <p className="text-xs text-emerald-500">Online</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search chats or users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* New group modal */}
      {showNewGroup && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-brand-50 dark:bg-brand-900/20 animate-slide-in">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">New Group</p>
          <input className="input text-sm mb-2" placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
          <input className="input text-sm mb-2" placeholder="Description (optional)" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
          <p className="text-xs text-gray-500 mb-1">Add members:</p>
          <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
            {allUsers.length === 0 && <p className="text-xs text-gray-400">Loading users…</p>}
            {allUsers.map(u => {
              const selected = selectedUsers.find(s => s._id === u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => setSelectedUsers(selected ? selectedUsers.filter(s => s._id !== u._id) : [...selectedUsers, u])}
                  className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${selected ? "bg-brand-100 dark:bg-brand-900/40" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <Avatar user={u} size="xs" />
                  <span className="text-xs text-gray-700 dark:text-gray-200">{u.username}</span>
                  {selected && <span className="ml-auto text-brand-600 text-xs">✓</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={handleGroupCreate} className="btn-primary text-xs py-1.5 flex-1">Create</button>
            <button onClick={() => setShowNewGroup(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {["chats", "people"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors
              ${tab === t
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Room / User list */}
      <div className="flex-1 overflow-y-auto">
        {/* Search results overlay */}
        {searchQuery && tab === "chats" && (
          <div className="p-2">
            {searching && <p className="text-xs text-center text-gray-400 py-2">Searching…</p>}
            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-xs text-center text-gray-400 py-2">No users found</p>
            )}
            {searchResults.map(u => (
              <button
                key={u._id}
                onClick={() => handleDM(u._id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar user={u} size="sm" showOnline isOnline={isUserOnline(u._id, onlineUsers)} />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chats tab */}
        {tab === "chats" && !searchQuery && (
          <div className="p-2 space-y-0.5">
            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">No chats yet. Search for a user to start!</p>
              </div>
            )}
            {filteredRooms.map(room => {
              const displayName = getDMName(room, user._id);
              const avatarUser = room.type === "dm" ? getDMAvatar(room, user._id) : null;
              const isActive = activeRoom?._id === room._id;
              const online = room.type === "dm"
                ? isUserOnline(avatarUser?._id, onlineUsers)
                : false;
              const unread = unreadCounts[room._id] || 0;
              const lastMsg = room.lastMessage;

              return (
                <button
                  key={room._id}
                  onClick={() => { onRoomSelect(room); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150
                    ${isActive
                      ? "bg-brand-50 dark:bg-brand-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                  {room.type === "group" ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {room.name?.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <Avatar user={avatarUser} size="md" showOnline isOnline={online} />
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-brand-700 dark:text-brand-300" : "text-gray-900 dark:text-white"}`}>
                        {displayName}
                      </p>
                      {lastMsg && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {formatChatDate(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 truncate">
                        {lastMsg
                          ? lastMsg.type !== "text"
                            ? "📎 File"
                            : truncate(lastMsg.content, 30)
                          : "No messages yet"
                        }
                      </p>
                      {unread > 0 && (
                        <span className="ml-1 flex-shrink-0 bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* People tab */}
        {tab === "people" && (
          <div className="p-2 space-y-0.5">
            {allUsers.map(u => (
              <button
                key={u._id}
                onClick={() => handleDM(u._id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar user={u} size="md" showOnline isOnline={isUserOnline(u._id, onlineUsers)} />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</p>
                  <p className="text-xs text-gray-400 truncate">{u.bio || u.email}</p>
                </div>
                {isUserOnline(u._id, onlineUsers) && (
                  <span className="ml-auto text-xs text-emerald-500 flex-shrink-0">Online</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
