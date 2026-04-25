// src/components/profile/ProfilePanel.jsx
import { useState, useRef } from "react";
import Avatar from "../ui/Avatar";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";
import useCallStore from "../../context/callStore";
import { formatLastSeen, isUserOnline, getDMAvatar } from "../../utils/helpers";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

export default function ProfilePanel({ onClose }) {
  const { user, updateProfile } = useAuthStore();
  const { activeRoom, onlineUsers } = useChatStore();
  const { initiateCall } = useCallStore();

  // Determine whose profile to show
  const isOwnProfile = !activeRoom;
  const dmPartner = activeRoom?.type === "dm" ? getDMAvatar(activeRoom, user._id) : null;
  const profileUser = isOwnProfile ? user : dmPartner;
  const isGroup = activeRoom?.type === "group";

  // Edit state (own profile only)
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // "about" | "media"
  const [media, setMedia] = useState([]);
  const fileRef = useRef(null);

  const online = dmPartner ? isUserOnline(dmPartner._id, onlineUsers) : false;

  // Load shared media when media tab clicked
  const loadMedia = async () => {
    if (!activeRoom || media.length > 0) return;
    try {
      const { data } = await api.get(`/messages/${activeRoom._id}?limit=200`);
      const imgs = data.messages.filter((m) => m.type === "image" && m.fileUrl);
      setMedia(imgs);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile({ bio });
    setSaving(false);
    if (result.success) { toast.success("Profile updated!"); setEditing(false); }
    else toast.error(result.message || "Update failed");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Uploading avatar…", { id: "avatar" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/messages/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await updateProfile({ avatar: data.url });
      toast.success("Avatar updated!", { id: "avatar" });
    } catch { toast.error("Upload failed", { id: "avatar" }); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative h-56 bg-gradient-to-br from-brand-600 to-indigo-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative">
              {isGroup ? (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-900 shadow-xl">
                  {activeRoom?.name?.slice(0, 2).toUpperCase()}
                </div>
              ) : (
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden">
                    {profileUser?.avatar ? (
                      <img src={profileUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Avatar user={profileUser} size="xl" />
                    )}
                  </div>
                  {/* Camera icon for own profile */}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </>
                  )}
                </div>
              )}
              {/* Online dot */}
              {!isOwnProfile && !isGroup && (
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${online ? "bg-emerald-500" : "bg-gray-400"}`} />
              )}
            </div>
          </div>
        </div>

        {/* ── Name & status ───────────────────────────────────── */}
        <div className="mt-12 px-6 text-center pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
            {isGroup ? activeRoom?.name : profileUser?.username}
          </h2>
          {!isGroup && (
            <p className="text-sm text-gray-400 mt-0.5">
              {isOwnProfile
                ? profileUser?.email
                : online ? "Online" : `Last seen ${formatLastSeen(profileUser?.lastSeen)}`
              }
            </p>
          )}
          {isGroup && (
            <p className="text-sm text-gray-400 mt-0.5">
              {activeRoom?.participants?.length} members
            </p>
          )}
        </div>

        {/* ── Call buttons (DM only) ──────────────────────────── */}
        {!isOwnProfile && !isGroup && dmPartner && (
          <div className="flex justify-center gap-8 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { initiateCall(dmPartner._id, dmPartner.username, dmPartner.avatar, "voice"); onClose(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Voice</span>
            </button>

            <button
              onClick={() => { initiateCall(dmPartner._id, dmPartner.username, dmPartner.avatar, "video"); onClose(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Video</span>
            </button>

            <button
              onClick={() => { onClose(); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Message</span>
            </button>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {["about", "media"].map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); if (t === "media") loadMedia(); }}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors
                ${activeTab === t
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* About tab */}
          {activeTab === "about" && (
            <div className="space-y-4">
              {/* Bio */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Bio</p>
                  {isOwnProfile && !editing && (
                    <button onClick={() => setEditing(true)} className="text-xs text-brand-500 hover:text-brand-700">
                      Edit
                    </button>
                  )}
                </div>
                {isOwnProfile && editing ? (
                  <div className="space-y-2">
                    <textarea
                      className="input text-sm resize-none"
                      rows={3}
                      maxLength={150}
                      placeholder="Write something about yourself…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 flex-1">
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setBio(user?.bio || ""); setEditing(false); }} className="btn-ghost text-xs py-1.5">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {profileUser?.bio || (isOwnProfile ? "Tap Edit to add a bio" : "No bio yet")}
                  </p>
                )}
              </div>

              {/* Info rows */}
              {!isGroup && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">Info</p>
                  <InfoRow icon="📧" label="Email" value={profileUser?.email} />
                  {!isOwnProfile && (
                    <InfoRow icon="⏰" label="Last seen" value={online ? "Online now" : formatLastSeen(profileUser?.lastSeen)} />
                  )}
                </div>
              )}

              {/* Group members */}
              {isGroup && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                    Members ({activeRoom?.participants?.length})
                  </p>
                  <div className="space-y-2">
                    {activeRoom?.participants?.map((p) => (
                      <div key={p._id} className="flex items-center gap-3">
                        <Avatar user={p} size="sm" showOnline isOnline={isUserOnline(p._id, onlineUsers)} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.username}</p>
                          {activeRoom?.admins?.includes(p._id) && (
                            <span className="text-xs text-brand-500">Admin</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media tab */}
          {activeTab === "media" && (
            <div>
              {media.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm">No shared media yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {media.map((m) => (
                    <a key={m._id} href={m.fileUrl} target="_blank" rel="noreferrer">
                      <img
                        src={m.fileUrl}
                        alt="media"
                        className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 dark:text-gray-200">{value || "—"}</p>
      </div>
    </div>
  );
}
