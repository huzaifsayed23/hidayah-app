import re

file_path = r'c:\Hidayah\src\components\community\StoriesRow.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { X, ChevronLeft, ChevronRight, BookOpen, Sparkles, Clock } from 'lucide-react';",
    "import { X, ChevronLeft, ChevronRight, BookOpen, Sparkles, Clock, Eye } from 'lucide-react';\nimport { useRouter } from 'next/navigation';"
)

# 2. Add currentUserId and viewers modal state
state_str = '''  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);'''

new_state_str = state_str + '''
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<boolean>(false);
  const router = useRouter();'''

content = content.replace(state_str, new_state_str)

# 3. Get currentUserId in useEffect
fetch_str = '''  // Fetch stories on mount
  useEffect(() => {
    const fetchStories = async () => {'''

new_fetch_str = '''  // Fetch stories on mount
  useEffect(() => {
    try {
      const userJsonStr = localStorage.getItem('hidayah_user');
      if (userJsonStr) {
        const userJson = JSON.parse(userJsonStr);
        setCurrentUserId(userJson?.user?._id || userJson?.user?.id || userJson?._id || userJson?.id || null);
      }
    } catch (e) {}

    const fetchStories = async () => {'''

content = content.replace(fetch_str, new_fetch_str)

# 4. Update markAsViewed to call API
mark_str = '''  // Mark a story as viewed
  const markAsViewed = (storyId: string) => {
    if (!viewedStoryIds.includes(storyId)) {
      const updated = [...viewedStoryIds, storyId];
      setViewedStoryIds(updated);
      safeStorage.setItem('hidayah_viewed_stories', JSON.stringify(updated));
    }
  };'''

new_mark_str = '''  // Mark a story as viewed
  const markAsViewed = (storyId: string) => {
    if (!viewedStoryIds.includes(storyId)) {
      const updated = [...viewedStoryIds, storyId];
      setViewedStoryIds(updated);
      safeStorage.setItem('hidayah_viewed_stories', JSON.stringify(updated));
      
      hidayahFetch(`/api/posts/${storyId}/view`, { method: 'POST' }).catch(console.error);
    }
  };'''

content = content.replace(mark_str, new_mark_str)

# 5. Pause progress timer when viewers modal is open
effect_str = '''      // Start progress bar animator
      const intervalMs = 50;
      const step = (intervalMs / STORY_DURATION_MS) * 100;
      progressIntervalRef.current = setInterval(() => {
        setProgressPercent(prev => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current!);
            return 100;
          }
          return prev + step;
        });
      }, intervalMs);

      // Start the timeout to go to next story
      progressTimerRef.current = setTimeout(() => {
        handleNext();
      }, STORY_DURATION_MS);'''

new_effect_str = '''      if (!showViewersModal) {
        // Start progress bar animator
        const intervalMs = 50;
        const step = (intervalMs / STORY_DURATION_MS) * 100;
        progressIntervalRef.current = setInterval(() => {
          setProgressPercent(prev => {
            if (prev >= 100) {
              clearInterval(progressIntervalRef.current!);
              return 100;
            }
            return prev + step;
          });
        }, intervalMs);

        // Start the timeout to go to next story
        progressTimerRef.current = setTimeout(() => {
          handleNext();
        }, STORY_DURATION_MS);
      }'''

content = content.replace(effect_str, new_effect_str)

dep_str = '''  }, [activeUserIndex, activeStoryIndex]);'''
new_dep_str = '''  }, [activeUserIndex, activeStoryIndex, showViewersModal]);'''
content = content.replace(dep_str, new_dep_str)

# 6. Make Profile Image/Username clickable
profile_ui_str = '''                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                      {activeUser.userImage ? (
                        <img src={activeUser.userImage} alt={activeUser.username} className="w-full h-full object-cover" />
                      ) : (
                        activeUser.username.replace('@', '').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{activeUser.username}</h3>
                      <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-semibold mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{getRemainingTimeText(activeStory.expiresAt)}</span>
                      </div>
                    </div>
                  </div>'''

new_profile_ui_str = '''                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseViewer();
                      router.push(`/profile?u=${activeUser.username.replace('@', '')}`);
                    }}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                      {activeUser.userImage ? (
                        <img src={activeUser.userImage} alt={activeUser.username} className="w-full h-full object-cover" />
                      ) : (
                        activeUser.username.replace('@', '').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{activeUser.username}</h3>
                      <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-semibold mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{getRemainingTimeText(activeStory.expiresAt)}</span>
                      </div>
                    </div>
                  </button>'''

content = content.replace(profile_ui_str, new_profile_ui_str)

# 7. Add View Count for Owner and the Bottom Sheet Modal
interface_str = '''  backdropVariant: number;
}'''
new_interface_str = '''  backdropVariant: number;
  viewers?: { userId: string; username: string; userImage: string | null; viewedAt: string }[];
}'''
content = content.replace(interface_str, new_interface_str)

bottom_ui_str = '''              {/* Bottom Navigation Buttons */}
              <div className="w-full flex justify-between items-center px-4 py-2 pointer-events-auto">'''

new_bottom_ui_str = '''              {/* Bottom Navigation Buttons */}
              <div className="w-full flex justify-between items-center px-4 py-2 pointer-events-auto relative">
                
                {/* Viewers Indicator (Owner Only) */}
                {activeUser.userId === currentUserId && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewersModal(true);
                    }}
                    className="absolute left-1/2 -top-12 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 hover:text-white transition-all active:scale-95 z-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{activeStory.viewers?.length || 0}</span>
                  </button>
                )}'''

content = content.replace(bottom_ui_str, new_bottom_ui_str)

modal_str = '''            </div>
          </motion.div>
        )}
      </AnimatePresence>'''

new_modal_str = '''            </div>
            
            {/* Viewers Bottom Sheet Modal */}
            <AnimatePresence>
              {showViewersModal && activeUser.userId === currentUserId && (
                <div className="absolute inset-0 z-[400000] flex items-end pointer-events-auto">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewersModal(false);
                    }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="relative w-full max-w-lg mx-auto bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col z-10 max-h-[70vh] overflow-hidden"
                  >
                    <div className="flex flex-col items-center pt-3 pb-4 px-6 border-b border-[var(--color-hidayah-border)]/70 bg-[var(--color-hidayah-primary)] shrink-0">
                      <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mb-4" />
                      <div className="w-full flex items-center justify-between">
                        <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                          Viewed By
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] font-sans font-bold">
                            {activeStory.viewers?.length || 0}
                          </span>
                        </h3>
                        <button 
                          onClick={() => setShowViewersModal(false)}
                          className="p-1.5 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 transition-all active:scale-95"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {(!activeStory.viewers || activeStory.viewers.length === 0) ? (
                        <div className="py-12 text-center text-[var(--color-hidayah-dark)]/40">
                          <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No views yet</p>
                        </div>
                      ) : (
                        activeStory.viewers.map((viewer, i) => (
                          <button 
                            key={viewer.userId || i}
                            onClick={() => {
                              handleCloseViewer();
                              router.push(`/profile?u=${viewer.username.replace('@', '')}`);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-hidayah-secondary)]/50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/45 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                              {viewer.userImage ? (
                                <img src={viewer.userImage} alt={viewer.username} className="w-full h-full object-cover" />
                              ) : (
                                viewer.username.replace('@', '').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[var(--color-hidayah-dark)] truncate">{viewer.username}</p>
                            </div>
                            {viewer.viewedAt && (
                              <div className="text-[10px] text-[var(--color-hidayah-dark)]/40 shrink-0">
                                {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>'''

content = content.replace(modal_str, new_modal_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated StoriesRow.tsx successfully")
