import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { postsAPI, commentsAPI, communityGroupsAPI } from '../services/api';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderContentWithMentions(content, mentionUserIds, idToName) {
  if (!content) return null;
  const names = (mentionUserIds || [])
    .map((id) => idToName.get(String(id)))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!names.length) return content;
  const pattern = new RegExp(`(${names.map((n) => `@${escapeRegExp(n)}`).join('|')})`, 'g');
  const parts = content.split(pattern);
  return parts.map((part, i) => {
    const hit = names.some((n) => part === `@${n}`);
    if (hit) {
      return (
        <span key={i} className="bg-indigo-50 text-indigo-600 font-bold rounded px-1">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function CommentThread({
  comment,
  depth,
  currentUserId,
  replyingTo,
  setReplyingTo,
  onDelete,
  idToName,
}) {
  const indent = Math.min(depth, 3) * 14;

  return (
    <div
      className="mt-6 border-l-2 border-slate-100 pl-6"
      style={{ marginLeft: depth === 0 ? 0 : indent }}
    >
      <div className="bg-white p-6 rounded-[2rem] border border-slate-50 flex flex-col sm:flex-row sm:justify-between gap-6 group shadow-sm transition-all hover:shadow-xl">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-white flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-inner">
              {comment.isAnonymous ? '👻' : (comment.author?.name?.[0] || 'A').toUpperCase()}
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight text-lg">
              {comment.isAnonymous ? comment.authorAlias : comment.author?.name || 'Member'}
              {!comment.isAnonymous && comment.author?.role === 'counselor' && (
                <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest font-black shadow-sm">Verified Counselor</span>
              )}
            </span>
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
              • {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-600 text-[15px] leading-relaxed pl-1 sm:pl-11 sm:-mt-1 font-medium whitespace-pre-wrap">
            {renderContentWithMentions(comment.content, comment.mentions, idToName)}
          </p>
          <div className="pl-1 sm:pl-11 flex gap-4">
            <button
                type="button"
                onClick={() =>
                setReplyingTo({
                    commentId: comment._id,
                    authorName: comment.isAnonymous ? comment.authorAlias : comment.author?.name || 'Member',
                })
                }
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors"
            >
                Reply
            </button>
            {String(comment.authorId || comment.author?._id || comment.author) === String(currentUserId) && (
              <button
                type="button"
                onClick={() => onDelete(comment._id)}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onDelete={onDelete}
              idToName={idToName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── GROUP DETAIL MODAL ─── */
function GroupDetailModal({ group, isMember, onJoin, onClose, joining }) {
  if (!group) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="glass-panel !rounded-[4rem] p-12 lg:p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl shadow-inner">
              {group.icon || group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-1">{group.category}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{group.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white">✕</button>
        </div>

        <div className="relative z-10 space-y-8">
          <p className="text-slate-600 text-lg leading-relaxed font-medium">{group.description}</p>

          <div className="flex flex-wrap gap-2">
            {(group.tags || []).map(tag => (
              <span key={tag} className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {group.memberCount != null && (
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
              <span className="text-lg">👥</span>
              <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          )}

          {group.moderatorIds?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Moderators</p>
              <div className="flex flex-wrap gap-2">
                {group.moderatorIds.map(mod => (
                  <span key={mod._id || mod} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                    {mod.name || mod.alias || 'Moderator'}
                    {mod.role === 'counselor' && <span className="ml-1 text-[9px] opacity-60">• Counselor</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {group.rules?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Community Guidelines</p>
              <ul className="space-y-2">
                {group.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {group.isPrivate && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <p className="text-amber-700 text-sm font-bold">This is a private group. Content is only visible to members.</p>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100">
            {isMember ? (
              <div className="text-center text-emerald-600 font-black text-sm uppercase tracking-widest py-4">
                ✓ You are a member of this group
              </div>
            ) : (
              <button
                onClick={() => onJoin(group._id)}
                disabled={joining}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-indigo-500 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join This Group →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Group detail modal
  const [detailGroup, setDetailGroup] = useState(null);
  const [joining, setJoining] = useState(false);

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [mentionCandidates, setMentionCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', isAnonymous: false, isTriggerWarning: false });
  
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', category: '', tags: '', rules: '', icon: '🌱', isPrivate: false });
  
  const [newComment, setNewComment] = useState({ content: '', isAnonymous: false });
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingMentions, setPendingMentions] = useState([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  
  // Local state to track which posts have had their Trigger Warning revealed
  const [revealedPosts, setRevealedPosts] = useState(new Set());

  const textareaRef = useRef(null);

  const userRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  const me = userRaw ? JSON.parse(userRaw) : null;
  const currentUserId = me?._id || me?.id || null;

  const idToName = useMemo(() => {
    const m = new Map();
    mentionCandidates.forEach((c) => m.set(String(c.userId), c.displayName));
    return m;
  }, [mentionCandidates]);

  const fetchGroups = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await communityGroupsAPI.getAll(params);
      setGroups(res.groups || []);
      setJoinedGroupIds(res.joinedGroupIds || []);
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      const params = {};
      if (value.trim()) params.search = value.trim();
      if (activeCategory) params.category = activeCategory;
      fetchGroups(params);
    }, 350);
    setSearchTimeout(timeout);
  };

  const handleCategoryFilter = (cat) => {
    const nextCat = activeCategory === cat ? '' : cat;
    setActiveCategory(nextCat);
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (nextCat) params.category = nextCat;
    fetchGroups(params);
  };

  const fetchPosts = async (groupId) => {
    try {
      setLoading(true);
      const response = await postsAPI.getAll(groupId);
      setPosts(response.posts ?? []);
      setRevealedPosts(new Set());
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setActiveGroup(group);
    fetchPosts(group._id);
    setSelectedPost(null);
  };

  const handleBackToGroups = () => {
    setActiveGroup(null);
    setPosts([]);
    setSelectedPost(null);
    // Refresh groups to get updated member counts
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (activeCategory) params.category = activeCategory;
    fetchGroups(params);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      setJoining(true);
      await communityGroupsAPI.join(groupId);
      // Re-fetch groups to get updated member counts and joinedGroupIds
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory) params.category = activeCategory;
      await fetchGroups(params);
      setDetailGroup(null);
    } catch (error) {
      console.error('Failed to join group:', error);
      alert(error.response?.data?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      if (!window.confirm('Are you sure you want to leave this support group?')) return;
      await communityGroupsAPI.leave(groupId);
      // Re-fetch groups to get updated counts
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory) params.category = activeCategory;
      await fetchGroups(params);
      if (activeGroup?._id === groupId) {
         handleBackToGroups();
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  const fetchPostDetails = async (postId) => {
    try {
      const [detail, candRes] = await Promise.all([
        postsAPI.getById(postId),
        postsAPI.getMentionCandidates(postId).catch(() => ({ candidates: [] })),
      ]);
      setSelectedPost(detail);
      setMentionCandidates(candRes.candidates ?? []);
    } catch (error) {
      console.error('Failed to fetch post details:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const res = await postsAPI.create({ ...newPost, groupId: activeGroup._id });
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', isAnonymous: false, isTriggerWarning: false });
      
      if (res.isCrisis) {
         alert(res.message); // Show the crisis intervention message
      } else {
         fetchPosts(activeGroup._id);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error.response?.data?.message || 'Failed to create post');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await communityGroupsAPI.create(newGroup);
      setShowCreateGroupModal(false);
      setNewGroup({ name: '', description: '', category: '', tags: '', rules: '', icon: '🌱', isPrivate: false });
      
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory) params.category = activeCategory;
      fetchGroups(params);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedPost?.post?._id || !newComment.content.trim()) return;
    const postId = selectedPost.post._id;
    const body = {
      content: newComment.content.trim(),
      isAnonymous: newComment.isAnonymous,
      mentions: [...new Set(pendingMentions)],
      parentCommentId: replyingTo?.commentId || undefined,
    };
    try {
      if (replyingTo?.commentId) {
        await commentsAPI.reply(postId, replyingTo.commentId, body);
      } else {
        await commentsAPI.create(postId, body);
      }
      setNewComment({ content: '', isAnonymous: false });
      setReplyingTo(null);
      setPendingMentions([]);
      setMentionOpen(false);
      fetchPostDetails(postId);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleCommentChange = (e) => {
    const v = e.target.value;
    setNewComment({ ...newComment, content: v });
    const pos = e.target.selectionStart ?? v.length;
    const before = v.slice(0, pos);
    const at = before.lastIndexOf('@');
    if (at === -1) {
      setMentionOpen(false);
      return;
    }
    const chunk = before.slice(at);
    if (chunk.includes('\n')) {
      setMentionOpen(false);
      return;
    }
    const afterAt = before.slice(at + 1);
    if (afterAt.includes(' ')) {
      setMentionOpen(false);
      return;
    }
    setMentionFilter(afterAt.toLowerCase());
    setMentionOpen(true);
  };

  const insertMention = (candidate) => {
    const ta = textareaRef.current;
    const v = newComment.content;
    const pos = ta?.selectionStart ?? v.length;
    const before = v.slice(0, pos);
    const after = v.slice(pos);
    const at = before.lastIndexOf('@');
    if (at === -1) return;
    const next = `${v.slice(0, at)}@${candidate.displayName} ${after}`;
    setNewComment({ ...newComment, content: next });
    setPendingMentions((p) => [...new Set([...p, String(candidate.userId)])]);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        const newPos = at + candidate.displayName.length + 2;
        ta.setSelectionRange(newPos, newPos);
      }
    });
  };

  const filteredCandidates = mentionCandidates.filter((c) =>
    c.displayName.toLowerCase().includes(mentionFilter)
  );

  const handleSupport = async (postId) => {
    try {
      await postsAPI.toggleLike(postId);
      fetchPosts(activeGroup._id);
      if (selectedPost && selectedPost.post._id === postId) {
        fetchPostDetails(postId);
      }
    } catch (error) {
      console.error('Failed to send support:', error);
    }
  };

  const handleReport = async (postId) => {
    const reason = prompt('Please provide a reason for the reporting action:');
    if (reason) {
      try {
        await postsAPI.report(postId, reason);
        alert('Record flagged for review.');
      } catch (error) {
        console.error('Failed to report post:', error);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(commentId);
      fetchPostDetails(selectedPost.post._id);
    } catch {
      console.error('Failed to delete comment');
    }
  };

  const toggleReveal = (postId) => {
    setRevealedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const myGroups = groups.filter(g => joinedGroupIds.includes(g._id));
  const discoverGroups = groups.filter(g => !joinedGroupIds.includes(g._id));

  return (
    <div className="min-h-screen bg-[#fcfdfe] py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Peer Support Network</p>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              Community <br />
              <span className="italic font-normal">Groups.</span>
            </h1>
          </div>
          {activeGroup ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBackToGroups}
                className="btn-serene-secondary !px-8"
              >
                ← Back to Groups
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-serene-primary !px-10 !py-5 shadow-2xl shadow-indigo-100 flex items-center gap-4 text-lg"
              >
                <span>✨</span> Share Experience
              </button>
            </div>
          ) : (
             <div className="flex items-center gap-4">
               <button
                 type="button"
                 onClick={() => setShowCreateGroupModal(true)}
                 className="btn-serene-primary !px-10 !py-5 shadow-2xl shadow-indigo-100 flex items-center gap-4 text-lg"
               >
                 <span>➕</span> Create Group
               </button>
             </div>
          )}
        </div>

        {loading && !activeGroup && !groups.length ? (
          <div className="text-center py-40">
             <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
             <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Loading Support Groups...</p>
          </div>
        ) : !activeGroup ? (
          <div className="space-y-16 animate-in fade-in duration-700">

             {/* ── SEARCH & FILTER BAR ── */}
             <div className="space-y-6">
               <div className="relative max-w-2xl">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-lg">🔍</span>
                 <input
                   type="text"
                   placeholder="Search groups by name, topic, or tag..."
                   value={searchQuery}
                   onChange={(e) => handleSearchChange(e.target.value)}
                   className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none shadow-sm"
                 />
                 {searchQuery && (
                   <button
                     onClick={() => { setSearchQuery(''); fetchGroups(activeCategory ? { category: activeCategory } : {}); }}
                     className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors text-sm font-black"
                   >
                     ✕
                   </button>
                 )}
               </div>

               {/* Category pills */}
               {categories.length > 0 && (
                 <div className="flex flex-wrap gap-3">
                   <button
                     onClick={() => handleCategoryFilter('')}
                     className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                       !activeCategory
                         ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                         : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                     }`}
                   >
                     All Groups
                   </button>
                   {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => handleCategoryFilter(cat)}
                       className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                         activeCategory === cat
                           ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                           : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                       }`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* My Groups Section */}
             {myGroups.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Your Support Groups</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myGroups.map(group => (
                       <div key={group._id} className="glass-card !p-8 hover:-translate-y-2 hover:shadow-2xl transition-all cursor-pointer group" onClick={() => handleGroupSelect(group)}>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shadow-inner">
                               {group.icon || group.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{group.category}</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                          <p className="text-sm text-slate-500 mb-8 line-clamp-2">{group.description}</p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                             <div className="flex items-center gap-4">
                               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Joined</span>
                               <span className="text-[10px] font-bold text-slate-300">👥 {group.memberCount || 0}</span>
                             </div>
                             <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">Enter →</span>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
             )}

             {/* Discover Groups Section */}
             {discoverGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Discover Groups</h2>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {discoverGroups.map(group => (
                       <div key={group._id} className="glass-card !p-8 border border-slate-100 flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner">
                                 {group.icon || group.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{group.category}</span>
                            </div>
                            {group.isPrivate && <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">Private</span>}
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-2">{group.name}</h3>
                          <p className="text-sm text-slate-500 mb-4 line-clamp-3 flex-1">{group.description}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 mb-6">
                            <span>👥</span> <span>{group.memberCount || 0} members</span>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setDetailGroup(group)}
                              className="flex-1 btn-serene-secondary !py-3 !bg-slate-50 border-transparent text-[10px] font-black uppercase tracking-widest"
                            >
                               View Details
                            </button>
                            <button 
                              onClick={() => handleJoinGroup(group._id)}
                              className="flex-1 btn-serene-primary !py-3 text-[10px] font-black uppercase tracking-widest"
                            >
                               Join Group
                            </button>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
             )}

             {/* Empty state: no groups found */}
             {!loading && groups.length === 0 && (
               <div className="glass-panel !rounded-[4rem] p-32 text-center border-none shadow-sm relative overflow-hidden bg-slate-50/50">
                 <div className="text-6xl block mb-10">🌱</div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">
                   {searchQuery || activeCategory ? 'No Groups Found' : 'No Support Groups Yet'}
                 </h3>
                 <p className="text-slate-400 font-medium text-lg italic max-w-md mx-auto">
                   {searchQuery || activeCategory
                     ? 'Try adjusting your search or filter to find what you\'re looking for.'
                     : 'Community groups haven\'t been set up yet. An admin or counselor can create the first group.'}
                 </p>
                 {(searchQuery || activeCategory) && (
                   <button
                     onClick={() => { setSearchQuery(''); setActiveCategory(''); fetchGroups(); }}
                     className="btn-serene-secondary mt-8 !px-8"
                   >
                     Clear Filters
                   </button>
                 )}
               </div>
             )}

             {/* Empty state: all groups joined */}
             {!loading && groups.length > 0 && myGroups.length === 0 && discoverGroups.length === 0 && (
               <div className="glass-panel !rounded-[4rem] p-20 text-center border-none shadow-sm bg-indigo-50/30">
                 <div className="text-5xl mb-6">🎉</div>
                 <h3 className="text-2xl font-black text-slate-900 mb-2">You're in all groups!</h3>
                 <p className="text-slate-500 font-medium">You've joined every available support group.</p>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-500">
             
             {/* Active Group Header */}
             <div className="glass-panel !rounded-[3rem] p-10 bg-white border border-indigo-50 shadow-xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center gap-6">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                     {activeGroup.icon || activeGroup.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{activeGroup.category}</p>
                     <h2 className="text-3xl font-black text-slate-900 mb-1">{activeGroup.name}</h2>
                     <p className="text-slate-500 max-w-2xl text-sm">{activeGroup.description}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleLeaveGroup(activeGroup._id)}
                  className="relative z-10 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 px-6 py-3 rounded-xl border border-rose-100 bg-rose-50/50 transition-colors shrink-0"
                >
                   Leave Group
                </button>
             </div>

            {loading ? (
               <div className="text-center py-20">
                  <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto" />
               </div>
            ) : posts.length === 0 ? (
              <div className="glass-panel !rounded-[4rem] p-32 text-center border-none shadow-sm relative overflow-hidden bg-slate-50/50">
                <div className="text-6xl block mb-10 italic font-serif text-slate-200">ø</div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">Quiet Atmosphere</h3>
                <p className="text-slate-400 font-medium text-lg italic">Be the first to share in this space.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {posts.map((post) => {
                  const isRevealed = revealedPosts.has(post._id);
                  const isTW = post.isTriggerWarning;

                  return (
                  <div
                    key={post._id}
                    className="glass-card !p-12 hover:shadow-2xl hover:ring-8 ring-indigo-50/50 transition-all duration-700 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-50" />
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-white shadow-inner flex items-center justify-center text-indigo-700 font-black shadow-md text-2xl">
                          {post.isAnonymous ? '👤' : (post.author?.name?.[0] || 'A').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-2xl tracking-tighter leading-none flex items-center gap-2">
                            {post.isAnonymous ? post.authorAlias : post.author?.name || 'Anonymous Member'}
                            {!post.isAnonymous && post.author?.role === 'counselor' && (
                               <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Verified Counselor</span>
                            )}
                          </p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">
                             Posted: {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isTW && (
                         <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm">
                            Trigger Warning
                         </div>
                      )}
                    </div>

                    {!isTW || isRevealed ? (
                       <>
                        <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-none">{post.title}</h3>
                        <p className="text-slate-600 mb-10 text-lg leading-relaxed whitespace-pre-wrap font-medium max-w-4xl">{post.content}</p>
                       </>
                    ) : (
                       <div className="bg-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center mb-10 border-2 border-dashed border-slate-200">
                          <span className="text-3xl mb-4 opacity-50">👁️</span>
                          <h4 className="text-xl font-black text-slate-900 mb-2">Content Hidden</h4>
                          <p className="text-slate-500 mb-6 max-w-sm text-sm">This post was marked with a trigger warning by the author. Read only when you feel ready.</p>
                          <button onClick={() => toggleReveal(post._id)} className="btn-serene-secondary !px-8">Reveal Post</button>
                       </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-8 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => handleSupport(post._id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border shadow-sm ${
                           post.supports?.includes(currentUserId) 
                           ? 'bg-teal-50 border-teal-200 text-teal-700' 
                           : 'bg-white border-slate-100 hover:border-teal-100 hover:text-teal-600'
                        }`}
                      >
                        <span className="text-xl">🫂</span> 
                        <span className="font-black text-[10px] uppercase tracking-widest">Support ({post.supports?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPost?.post._id === post._id) {
                            setSelectedPost(null);
                            setReplyingTo(null);
                            setMentionCandidates([]);
                          } else {
                            fetchPostDetails(post._id);
                            if (isTW) setRevealedPosts(prev => new Set(prev).add(post._id));
                          }
                        }}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border shadow-sm ${
                           selectedPost?.post._id === post._id 
                           ? 'bg-indigo-600 border-indigo-600 text-white' 
                           : 'bg-white border-slate-100 hover:border-indigo-100 hover:text-indigo-600'
                        }`}
                      >
                        <span className="text-xl">💬</span>{' '}
                        <span className="font-black text-[10px] uppercase tracking-widest">
                           {selectedPost?.post._id === post._id ? 'Close Discussion' : 'Join Discussion'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReport(post._id)}
                        className="flex items-center gap-3 bg-slate-50/50 px-6 py-3 rounded-2xl ml-auto transition-all text-slate-300 hover:text-rose-400 border border-transparent hover:border-rose-100"
                      >
                        <span className="text-lg">🚩</span> <span className="font-black text-[10px] uppercase tracking-widest">Flag</span>
                      </button>
                    </div>

                    {selectedPost?.post._id === post._id && (
                      <div className="mt-12 pt-12 border-t-2 border-slate-50 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <form onSubmit={handleAddComment} className="flex flex-col gap-6 relative max-w-4xl">
                          {replyingTo && (
                            <div className="flex items-center justify-between bg-indigo-50/50 rounded-2xl px-6 py-3 border border-indigo-100">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                Replying to <strong>{replyingTo.authorName}</strong>
                              </span>
                              <button
                                type="button"
                                className="text-indigo-600 font-black text-[10px] uppercase underline"
                                onClick={() => setReplyingTo(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <div className="flex flex-col gap-4">
                            <div className="relative">
                              <textarea
                                ref={textareaRef}
                                className="w-full px-8 py-6 bg-slate-50/50 border-none rounded-[2rem] focus:ring-8 ring-indigo-50 transition-all resize-none text-slate-700 font-medium outline-none"
                                placeholder="Share your experience or support... Use @ to mention."
                                rows={3}
                                value={newComment.content}
                                onChange={handleCommentChange}
                                onKeyDown={(e) => {
                                  if (mentionOpen && e.key === 'Escape') setMentionOpen(false);
                                }}
                                required
                              />
                              {mentionOpen && filteredCandidates.length > 0 && (
                                <ul className="absolute z-60 left-4 right-4 bottom-full mb-2 max-h-48 overflow-y-auto rounded-3xl border border-indigo-100 bg-white shadow-2xl p-2">
                                  {filteredCandidates.map((c) => (
                                    <li key={c.userId}>
                                      <button
                                        type="button"
                                        className="w-full text-left px-5 py-3 hover:bg-indigo-50 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-indigo-600 rounded-2xl transition-all"
                                        onClick={() => insertMention(c)}
                                      >
                                        @{c.displayName}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                               <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 cursor-pointer select-none">
                                 <input
                                   type="checkbox"
                                   className="w-5 h-5 rounded-lg border-2 border-slate-100 checked:bg-indigo-600 transition-all"
                                   checked={newComment.isAnonymous}
                                   onChange={(e) => setNewComment({ ...newComment, isAnonymous: e.target.checked })}
                                 />
                                 Cloak Identity
                               </label>
                               
                               <button
                                 type="submit"
                                 className="btn-serene-primary !px-12 w-full sm:w-auto"
                               >
                                 Send Reply
                               </button>
                            </div>
                          </div>
                        </form>

                        <div className="space-y-4 pt-8">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200 mb-8 px-2">Discussions</p>
                          {(selectedPost.comments || []).length === 0 ? (
                            <p className="text-slate-300 text-sm font-medium italic text-center py-8">No replies yet. Be the first to respond.</p>
                          ) : (
                            (selectedPost.comments || []).map((comment) => (
                              <CommentThread
                                key={comment._id}
                                comment={comment}
                                depth={0}
                                currentUserId={currentUserId}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                onDelete={handleDeleteComment}
                                idToName={idToName}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </div>
        )}

        {showCreateModal && activeGroup && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500 overflow-y-auto">
            <div className="glass-panel !rounded-[4rem] p-12 lg:p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">New Post in {activeGroup.name}</p>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Share.</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white">✕</button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-8 relative z-10">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Title</label>
                   <input
                     type="text"
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-bold text-xl tracking-tight text-slate-900 placeholder:text-slate-300"
                     placeholder="What's on your mind?"
                     value={newPost.title}
                     onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                     required
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Details</label>
                   <textarea
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-medium text-base leading-relaxed text-slate-700 placeholder:text-slate-300 resize-none"
                     rows={5}
                     placeholder="Share your experience..."
                     value={newPost.content}
                     onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                     required
                   />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-3xl border border-white">
                    <div>
                      <p className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Anonymity Shield</p>
                      <p className="text-[10px] font-bold text-slate-400">Mask real identity from peers.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newPost.isAnonymous}
                        onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-rose-50/50 p-6 rounded-3xl border border-rose-50">
                    <div>
                      <p className="font-black text-rose-700 uppercase tracking-widest text-xs mb-1">Trigger Warning</p>
                      <p className="text-[10px] font-bold text-rose-400/80">Blur sensitive content until revealed.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={newPost.isTriggerWarning}
                        onChange={(e) => setNewPost({ ...newPost, isTriggerWarning: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-rose-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-rose-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
                  >
                    Post to Group →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Detail Modal */}
        {detailGroup && (
          <GroupDetailModal
            group={detailGroup}
            isMember={joinedGroupIds.includes(detailGroup._id)}
            onJoin={handleJoinGroup}
            onClose={() => setDetailGroup(null)}
            joining={joining}
          />
        )}
        
        {/* Create Group Modal */}
        {showCreateGroupModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500 overflow-y-auto">
            <div className="glass-panel !rounded-[4rem] p-12 lg:p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">New Community</p>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Create Group.</h2>
                </div>
                <button onClick={() => setShowCreateGroupModal(false)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white">✕</button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6 relative z-10">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Group Name</label>
                     <input
                       type="text"
                       className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-bold text-lg text-slate-900 placeholder:text-slate-300"
                       placeholder="E.g., Exam Stress Support"
                       value={newGroup.name}
                       onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                       required
                     />
                  </div>
                  <div className="col-span-1">
                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Icon</label>
                     <input
                       type="text"
                       className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-bold text-center text-2xl text-slate-900"
                       placeholder="🌱"
                       value={newGroup.icon}
                       onChange={(e) => setNewGroup({ ...newGroup, icon: e.target.value })}
                     />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Category</label>
                   <input
                     type="text"
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300"
                     placeholder="E.g., Academics, Wellbeing, Social..."
                     value={newGroup.category}
                     onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                     required
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Description</label>
                   <textarea
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                     rows={3}
                     placeholder="What is this group about?"
                     value={newGroup.description}
                     onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                     required
                   />
                </div>
                
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Tags (comma separated)</label>
                   <input
                     type="text"
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300"
                     placeholder="E.g., anxiety, sleep, exams"
                     value={newGroup.tags}
                     onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                   />
                </div>
                
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Community Rules (one per line)</label>
                   <textarea
                     className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 ring-indigo-50 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                     rows={4}
                     placeholder="1. Be kind...&#10;2. Use trigger warnings..."
                     value={newGroup.rules}
                     onChange={(e) => setNewGroup({ ...newGroup, rules: e.target.value })}
                   />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-amber-50/50 p-6 rounded-3xl border border-amber-50">
                  <div>
                    <p className="font-black text-amber-700 uppercase tracking-widest text-xs mb-1">Private Group</p>
                    <p className="text-[10px] font-bold text-amber-600/80">Hide content from non-members.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={newGroup.isPrivate}
                      onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
                  >
                    Create Group →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="text-center mt-32 text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">
           Structured Clinical Spaces • MindSpace Platform
        </p>
      </div>
    </div>
  );
};

export default Community;
