import re

file_path = r'c:\Hidayah\src\app\community\post\[id]\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { ArrowLeft, Bookmark, Share2, Heart, MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';",
    "import { ArrowLeft, Bookmark, Share2, Heart, MessageCircle, Send, Loader2, Trash2, X } from 'lucide-react';\nimport { createPortal } from 'react-dom';"
)

# 2. Add state variables and methods
state_str = '''  const [showComments, setShowComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [repliesList, setRepliesList] = useState<any[]>([]);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);'''

new_state_str = state_str + '''

  const [commentMenuId, setCommentMenuId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const commentTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCommentTouchStart = (replyId: string) => {
    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
    }
    commentTimerRef.current = setTimeout(() => {
      setCommentMenuId(replyId);
    }, 600) as any;
  };

  const handleCommentTouchEnd = () => {
    if (commentTimerRef.current) {
      clearTimeout(commentTimerRef.current);
      commentTimerRef.current = null;
    }
  };

  const toggleCommentLike = async (replyId: string) => {
    const loggedInUsername = (currentUser?.username || "").replace(/^@/, '').trim().toLowerCase();
    if (!loggedInUsername) {
      alert("Please sign in to like comments");
      return;
    }

    const originalReplies = [...repliesList];

    const updatedReplies = repliesList.map(r => {
      const rId = (r._id || r.id || "").toString();
      if (rId === replyId) {
        const likes = r.likes || [];
        const index = likes.indexOf(loggedInUsername);
        const newLikes = index === -1 
          ? [...likes, loggedInUsername]
          : likes.filter((u: string) => u !== loggedInUsername);
        return { ...r, likes: newLikes };
      }
      return r;
    });

    setRepliesList(updatedReplies);
    safeStorage.updateCommunityCache(id, { 
      replies: updatedReplies,
      commentCount: updatedReplies.length 
    });

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=like`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error("Failed to like comment");
      }
    } catch (err) {
      setRepliesList(originalReplies);
      safeStorage.updateCommunityCache(id, { 
        replies: originalReplies,
        commentCount: originalReplies.length 
      });
      console.error(err);
    }
  };

  const handleCommentReport = async (replyId: string) => {
    if (!window.confirm("Report this comment for violating community guidelines?")) return;
    
    setCommentMenuId(null);
    alert("Thank you. This comment has been reported and sent to our moderators for review.");
    
    try {
      await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=report`, {
        method: 'POST'
      });
    } catch (err) {
      console.error("Error reporting comment:", err);
    }
  };
'''
content = content.replace(state_str, new_state_str)

# 3. Update submitReply
submit_reply_str = '''  const submitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    
    const textToSubmit = replyText.trim();
    setReplyText("");
    setIsSubmittingReply(true);

    const optimisticReply = {
      _id: `temp-${Date.now()}`,
      author: currentUser?.username ? `@${currentUser.username}` : "User",
      content: textToSubmit,
      createdAt: new Date().toISOString()
    };
    
    const originalReplies = [...repliesList];
    setRepliesList([...repliesList, optimisticReply]);

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSubmit })
      });'''

new_submit_reply_str = '''  const submitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    
    const textToSubmit = replyText.trim();
    const parentIdSaved = replyingTo?.commentId || null;
    
    setReplyText("");
    setIsSubmittingReply(true);
    setReplyingTo(null);

    const optimisticReply = {
      _id: `temp-${Date.now()}`,
      author: currentUser?.username ? `@${currentUser.username}` : "User",
      content: textToSubmit,
      createdAt: new Date().toISOString(),
      likes: [],
      parentId: parentIdSaved
    };
    
    const originalReplies = [...repliesList];
    setRepliesList([...repliesList, optimisticReply]);

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSubmit, parentId: parentIdSaved })
      });'''
content = content.replace(submit_reply_str, new_submit_reply_str)

# 4. Update handleDeleteComment
delete_comment_str = '''  const handleDeleteComment = async (replyId: string) => {
    if (!window.confirm("Delete this comment?")) return;

    const originalReplies = [...repliesList];
    const updatedReplies = repliesList.filter(r => (r._id || r.id) !== replyId);
    setRepliesList(updatedReplies);

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=delete`, {
        method: 'POST'
      });
      if (res.ok) {
        safeStorage.updateCommunityCache(id, { 
          replies: updatedReplies,
          commentCount: updatedReplies.length 
        });
      } else {
        setRepliesList(originalReplies);
      }
    } catch (err) {
      setRepliesList(originalReplies);
    }
  };'''

new_delete_comment_str = '''  const handleDeleteComment = async (replyId: string) => {
    if (!replyId) return;

    const originalReplies = [...repliesList];
    
    const updatedReplies = repliesList.filter(r => {
      const rId = (r._id || r.id || "").toString();
      return rId !== replyId && r.parentId !== replyId;
    });
    setRepliesList(updatedReplies);
    setCommentMenuId(null);
    
    safeStorage.updateCommunityCache(id, { 
      replies: updatedReplies,
      commentCount: updatedReplies.length 
    });

    try {
      const res = await hidayahFetch(`/api/posts/${id}/reply/?replyId=${replyId}&action=delete`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        setRepliesList(originalReplies);
        safeStorage.updateCommunityCache(id, { 
          replies: originalReplies,
          commentCount: originalReplies.length 
        });
        const errorData = await res.json().catch(() => ({}));
        alert(`Could not delete comment: ${errorData.message || 'Server Error'}`);
      }
    } catch (err) {
      setRepliesList(originalReplies);
      safeStorage.updateCommunityCache(id, { 
        replies: originalReplies,
        commentCount: originalReplies.length 
      });
      console.error(err);
      alert("Connection error. Please check your internet.");
    }
  };'''
content = content.replace(delete_comment_str, new_delete_comment_str)

# 5. Replace inline comments with bottom sheet portal
# We find where '<AnimatePresence>' starts at the bottom
start_idx = content.rfind('<AnimatePresence>')
end_idx = content.rfind('</footer>')

sheet_code = '''{isMounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showComments && (
            <div className="fixed inset-0 z-[150000] flex items-end justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowComments(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              
              {/* Sheet */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.3}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 300) {
                    setShowComments(false);
                  }
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-full max-w-lg bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col z-10 max-h-[85vh] overflow-hidden"
              >
                {/* Drag Handle & Header */}
                <div className="flex flex-col items-center pt-3 pb-4 px-6 border-b border-[var(--color-hidayah-border)]/70 cursor-grab active:cursor-grabbing select-none shrink-0 bg-[var(--color-hidayah-primary)]">
                  <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mb-4" />
                  <div className="w-full flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[var(--color-hidayah-dark)] flex items-center gap-2">
                      Comments 
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--color-hidayah-secondary)] text-[var(--color-hidayah-dark)] font-sans font-bold">
                        {repliesList.length}
                      </span>
                    </h3>
                    <button 
                      onClick={() => setShowComments(false)}
                      className="p-1.5 rounded-full hover:bg-black/5 text-[var(--color-hidayah-dark)] opacity-60 hover:opacity-100 transition-all active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Comments List */}
                <div 
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar"
                  style={{ overscrollBehaviorY: 'contain' }}
                >
                  {(() => {
                    const rootComments = repliesList.filter((r: any) => !r.parentId);
                    const loggedInUsername = (currentUser?.username || "").replace(/^@/, '').trim().toLowerCase();
                    const loggedInEmail = (currentUser?.email || "").toLowerCase();

                    if (rootComments.length === 0) {
                      return (
                        <div className="py-16 text-center text-[var(--color-hidayah-dark)]/40">
                          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No comments yet</p>
                          <p className="text-xs opacity-60">Be the first to share your thoughts on this reflection.</p>
                        </div>
                      );
                    }

                    return rootComments.map((reply: any, i: number) => {
                      const renderCommentRow = (r: any, isReply: boolean = false) => {
                        const rId = (r._id || r.id || "").toString();
                        const replyAuthorClean = (r.author || "").replace(/^@/, '').trim().toLowerCase();
                        const hasLiked = r.likes?.includes(loggedInUsername);
                        const likeCount = r.likes?.length || 0;

                        return (
                          <div 
                            key={rId || i}
                            className={`flex gap-3 group/comment relative transition-all duration-200 ${isReply ? 'ml-10 pl-3 border-l-2 border-[var(--color-hidayah-border)]/30' : ''}`}
                            onTouchStart={() => handleCommentTouchStart(rId)}
                            onTouchEnd={handleCommentTouchEnd}
                            onTouchMove={handleCommentTouchEnd}
                            onMouseDown={() => handleCommentTouchStart(rId)}
                            onMouseUp={handleCommentTouchEnd}
                            onMouseLeave={handleCommentTouchEnd}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setCommentMenuId(rId);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-hidayah-secondary)] border border-[var(--color-hidayah-border)]/45 flex items-center justify-center font-bold text-xs shrink-0 text-[var(--color-hidayah-dark)] select-none">
                              {(r.author || "U").charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 bg-[var(--color-hidayah-secondary)]/30 rounded-2xl px-4 py-2.5 border border-[var(--color-hidayah-border)]/30 flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-bold text-[var(--color-hidayah-dark)] truncate max-w-[120px]">
                                    @{r.author ? r.author.replace(/^@/, "") : "User"}
                                  </span>
                                  <span className="text-[9px] text-[var(--color-hidayah-dark)] opacity-40">
                                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--color-hidayah-dark)]/85 leading-relaxed break-words">{r.content}</p>
                                
                                <div className="flex items-center gap-3 mt-1.5 select-none">
                                  {!r.parentId && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingTo({ commentId: rId, username: r.author });
                                      }}
                                      className="text-[10px] font-bold text-[var(--color-hidayah-dark)]/50 hover:text-[var(--color-hidayah-dark)] transition-colors active:scale-95"
                                    >
                                      Reply
                                    </button>
                                  )}
                                  <span className="text-[9px] text-[var(--color-hidayah-dark)]/35 opacity-0 group-hover/comment:opacity-100 transition-opacity pointer-events-none hidden sm:inline">
                                    Hold to option
                                  </span>
                                </div>
                              </div>

                              {/* Heart Like button on far right */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5 select-none">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCommentLike(rId);
                                  }}
                                  className="p-1 hover:bg-black/5 rounded-full transition-all active:scale-75"
                                >
                                  <Heart className={`w-3.5 h-3.5 transition-colors ${hasLiked ? 'fill-red-500 text-red-500' : 'opacity-40 hover:opacity-100 text-[var(--color-hidayah-dark)]'}`} />
                                </button>
                                {likeCount > 0 && (
                                  <span className="text-[9px] font-bold opacity-50 text-[var(--color-hidayah-dark)]">{likeCount}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      };

                      const commentReplies = repliesList.filter((r: any) => {
                        const pId = (r.parentId || "").toString();
                        const rId = (reply._id || reply.id || "").toString();
                        return pId === rId;
                      });

                      return (
                        <div key={reply._id || i} className="space-y-3">
                          {renderCommentRow(reply, false)}
                          
                          {/* Threaded Nested Replies */}
                          {commentReplies.length > 0 && (
                            <div className="space-y-3 mt-2">
                              {commentReplies.map((replyChild: any, idx: number) => 
                                renderCommentRow(replyChild, true)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Replying Target Banner */}
                {replyingTo && (
                  <div className="px-6 py-2 bg-[var(--color-hidayah-secondary)] border-t border-[var(--color-hidayah-border)]/50 flex justify-between items-center text-xs text-[var(--color-hidayah-dark)] animate-fade-in shrink-0">
                    <span className="opacity-70 font-medium">
                      Replying to <span className="font-bold">@{replyingTo.username.replace(/^@/, '')}</span>
                    </span>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="p-1 rounded-full hover:bg-black/5 opacity-60 hover:opacity-100 transition-all active:scale-90"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-[var(--color-hidayah-border)]/50 bg-[var(--color-hidayah-primary)] shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
                  <div className="flex gap-2.5 relative items-center">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={replyingTo ? `Reply to @${replyingTo.username.replace(/^@/, '')}...` : "Add a comment..."}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitReply(); }}
                      className="flex-1 rounded-full px-4 py-2.5 text-xs bg-black/5 border border-[var(--color-hidayah-border)] focus:outline-none text-[var(--color-hidayah-dark)] focus:border-[var(--color-hidayah-dark)] placeholder:text-[var(--color-hidayah-dark)]/40"
                    />
                    <button 
                      onClick={submitReply}
                      disabled={!replyText.trim() || isSubmittingReply}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 bg-[var(--color-hidayah-dark)] text-white disabled:opacity-30 disabled:scale-100 shrink-0 shadow-sm"
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Instagram-style Comment Action sheet modal */}
                <AnimatePresence>
                  {commentMenuId && (() => {
                    const selectedComment = repliesList.find((r: any) => (r._id || r.id || "").toString() === commentMenuId);
                    if (!selectedComment) return null;

                    const loggedInUsername = (currentUser?.username || "").replace(/^@/, '').trim().toLowerCase();
                    const loggedInEmail = (currentUser?.email || "").toLowerCase();
                    const replyAuthorClean = (selectedComment.author || "").replace(/^@/, '').trim().toLowerCase();
                    const isMyComment = loggedInUsername && replyAuthorClean && loggedInUsername === replyAuthorClean;
                    const isGlobalAdmin = ['huzaifsayed454@gmail.com', 'huzaifsayed23@gmail.com'].includes(loggedInEmail) || (currentUser?.isAdmin);
                    const canDelete = isMyComment || isGlobalAdmin;

                    return (
                      <div className="absolute inset-0 z-[200000] flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
                        <div 
                          onClick={() => setCommentMenuId(null)}
                          className="absolute inset-0"
                        />
                        
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{ type: "spring", damping: 25, stiffness: 220 }}
                          className="relative w-full max-w-lg bg-[var(--color-hidayah-primary)] text-[var(--color-hidayah-dark)] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] flex flex-col gap-3 z-10"
                        >
                          <div className="w-12 h-1.5 bg-[var(--color-hidayah-dark)]/15 rounded-full mx-auto mb-2" />
                          
                          <div className="text-center py-2 border-b border-[var(--color-hidayah-border)]/50">
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Comment Options</p>
                            <p className="text-xs text-[var(--color-hidayah-dark)]/70 truncate mt-1 px-4 font-serif italic">"{selectedComment.content}"</p>
                          </div>

                          {canDelete ? (
                            <button
                              onClick={() => handleDeleteComment(selectedComment._id || selectedComment.id)}
                              className="w-full py-4 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-2xl transition-all active:scale-98 text-center"
                            >
                              Delete Comment
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCommentReport(selectedComment._id || selectedComment.id)}
                              className="w-full py-4 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-2xl transition-all active:scale-98 text-center"
                            >
                              Report Comment
                            </button>
                          )}
                          
                          <button
                            onClick={() => setCommentMenuId(null)}
                            className="w-full py-4 text-sm font-bold opacity-60 hover:bg-black/5 rounded-2xl transition-all active:scale-98 text-center"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      </div>
                    );
                  })()}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}'''

new_content = content[:start_idx] + "\n" + sheet_code + "\n" + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated page.tsx successfully")
