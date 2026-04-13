import { useState } from 'react';
import axios from 'axios';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Loader2, Calendar, Link as LinkIcon, MapPin, Camera, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '../../components/tweet/ReportModal';
import { getUserProfile, getUserTweets, updateProfile, toggleFollowUser } from '../../api/users';
import TweetCard from '../../components/tweet/TweetCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import TweetComposer from '../../components/tweet/TweetComposer';
import Input from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

import FollowListModal from '../../components/profile/FollowListModal';

export default function Profile() {
  const { username } = useParams<{username: string}>();
  const { user: currentUser, setUser } = useAuthStore();
  const { showToast } = useToast();
  const isOwnProfile = currentUser?.username === username;
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '', website: '', avatar: '', header_image: '' });
  const [previewImages, setPreviewImages] = useState({ avatar: '', header_image: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      setIsEditModalOpen(false);
      setEditError('');
      if (res.data) setUser(res.data);
      showToast('Profile updated!', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setEditError(msg);
      showToast(msg, 'error');
    }
  });
  
  const followMutation = useMutation({
    mutationFn: () => toggleFollowUser(username!),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      showToast(res.message || 'Action successful', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to perform action', 'error');
    }
  });

  const handleOpenEdit = (user: any) => {
    setEditForm({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      avatar: user?.avatar || '',
      header_image: user?.header_image || ''
    });
    setPreviewImages({ avatar: '', header_image: '' });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview for visual feedback
    const objectUrl = URL.createObjectURL(file);
    setPreviewImages(prev => ({ ...prev, [type]: objectUrl }));

    setIsUploadingImage(true);
    setEditError('');
    
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('type', type === 'header_image' ? 'header' : 'avatar');

      // Use raw axios to avoid default headers like 'Content-Type: application/json' from our api instance
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/media/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          // DO NOT set Content-Type, let the browser set it with the boundary
        }
      });

      const url = res.data.data.url;
      setEditForm(prev => ({ ...prev, [type]: url }));
    } catch (error: any) {
      console.error("Failed to upload image", error);
      setEditError(`Failed to upload ${type}: ` + (error.response?.data?.message || error.message));
      // Revert preview on failure
      setPreviewImages(prev => ({ ...prev, [type]: '' }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    
    if (!editForm.name.trim()) {
      setEditError('Name is required');
      showToast('Name is required', 'error');
      return;
    }
    
    // Convert empty strings to null for nullable backend validation
    const payload: any = { 
       name: editForm.name,
       bio: editForm.bio.trim() || null,
       location: editForm.location.trim() || null,
       website: editForm.website.trim() || null,
       avatar: editForm.avatar || null,
       header_image: editForm.header_image || null
    };

    updateMutation.mutate(payload);
  };

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username!),
    enabled: !!username
  });

  const { data: tweets, isLoading: tweetsLoading } = useInfiniteQuery({
    queryKey: ['profile-tweets', username],
    queryFn: ({ pageParam = 1 }) => getUserTweets(username!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
    enabled: !!username
  });

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)] w-8 h-8" /></div>;
  }

  const user = profile?.data;

  if (!user) {
    return <div className="p-8 text-center text-red-500">User not found</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">{user.tweets_count || 0} Tweets</p>
        </div>
      </div>

      {/* Banner & Avatar */}
      <div className="h-48 bg-gradient-to-r from-blue-400 to-[#1da1f2] relative">
        {user.header_image && <img src={user.header_image} className="w-full h-full object-cover" alt="Banner" />}
        <div className="absolute -bottom-16 left-4 border-4 border-[var(--bg-color)] rounded-full">
          <Avatar name={user.name} src={user.avatar ?? undefined} size="xl" linkToProfile={false} />
        </div>
      </div>

      <div className="flex justify-end p-4 h-20 gap-2 items-start text-sm">
        {!isOwnProfile && (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 border border-[var(--border-color)] rounded-full hover:bg-[var(--hover-bg)] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-48 bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-2xl"
                  >
                    <button
                      onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/10 flex items-center gap-3 transition-colors font-medium"
                    >
                      <AlertTriangle size={16} className="text-orange-500/70" /> Report @{user.username}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
        {isOwnProfile ? (
          <Button variant="outline" size="sm" className="h-10" onClick={() => handleOpenEdit(user)}>Edit Profile</Button>
        ) : (
          <Button 
            variant={user.is_following || user.follow_status === 'pending' ? 'outline' : 'primary'} 
            size="sm" 
            className="h-10 min-w-[100px] group/follow"
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending}
          >
            {user.follow_status === 'pending' ? (
              'Requested'
            ) : user.is_following ? (
              <>
                <span className="group-hover/follow:hidden">Following</span>
                <span className="hidden group-hover/follow:inline text-red-500">Unfollow</span>
              </>
            ) : (
              'Follow'
            )}
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{user.name}</h2>
          {user.is_followed_by && (
            <span className="bg-[var(--hover-bg)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Follows you
            </span>
          )}
        </div>
        <p className="text-[var(--text-muted)]">@{user.username}</p>
        
        <p className="mt-3 text-[var(--text-color)]">
          {user.bio || "No bio yet."}
        </p>
        
        <div className="flex flex-wrap gap-4 mt-3 text-[var(--text-muted)] text-sm">
          {user.location && <span className="flex items-center gap-1"><MapPin size={16} /> {user.location}</span>}
          {user.website && <span className="flex items-center gap-1"><LinkIcon size={16} /> <a href={user.website} target="_blank" rel="noreferrer" className="text-[var(--color-chirp)] hover:underline">{user.website}</a></span>}
          <span className="flex items-center gap-1"><Calendar size={16} /> Joined {user.joined_at || 'Recently'}</span>
        </div>

        <div className="flex gap-4 mt-4 text-sm">
          <button onClick={() => { setFollowModalType('following'); setIsFollowModalOpen(true); }} className="hover:underline text-left">
            <b className="text-[var(--text-color)]">{user.following_count || 0}</b> <span className="text-[var(--text-muted)]">Following</span>
          </button>
          <button onClick={() => { setFollowModalType('followers'); setIsFollowModalOpen(true); }} className="hover:underline text-left">
            <b className="text-[var(--text-color)]">{user.followers_count || 0}</b> <span className="text-[var(--text-muted)]">Followers</span>
          </button>
        </div>
      </div>

      {/* Tweet Composer for Own Profile */}
      {isOwnProfile && <TweetComposer />}

      {/* User Tweets */}
      <div>
        {tweetsLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : (
          tweets?.pages.map((page, i) => (
            <div key={i}>
              {page.data.map((tweet: any) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-4 hide-scrollbar">
          {editError && (
             <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                {editError}
             </div>
          )}

          <div className="relative h-32 bg-gray-600 mb-14 rounded-t-xl group">
            {(previewImages.header_image || editForm.header_image || user?.header_image) ? (
               <img src={previewImages.header_image || (editForm.header_image ?? undefined) || (user?.header_image ?? undefined)} className="w-full h-full object-cover rounded-t-xl" alt="header" />
            ) : (
               <div className="w-full h-full bg-gradient-to-r from-blue-400 to-[#1da1f2] rounded-t-xl" />
            )}
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/50 transition rounded-t-xl">
               <Camera size={24} className="text-white drop-shadow-md" />
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'header_image')} />
            </label>
            
            <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-[var(--bg-color)] bg-gray-500 overflow-hidden group/avatar">
               <img src={previewImages.avatar || (editForm.avatar ?? undefined) || (user?.avatar ?? undefined) || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-full h-full object-cover rounded-full" alt="avatar" />
               <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/50 transition rounded-full">
                  <Camera size={16} className="text-white drop-shadow-md" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
               </label>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text-color)]">Bio</label>
              <textarea
                className="w-full bg-[var(--hover-bg)] border border-[var(--border-color)]/20 rounded-xl px-4 py-3 text-[var(--text-color)] focus:bg-[var(--bg-color)] focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] focus:outline-none transition resize-none"
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
            <Input
              label="Location"
              value={editForm.location}
              onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            />
            <Input
              label="Website"
              value={editForm.website}
              onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
            />
            <div className="flex justify-end gap-3 pt-6 pb-2">
              <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={updateMutation.isPending || isUploadingImage}>Save</Button>
            </div>
          </form>
        </div>
      </Modal>
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportableId={user.id}
        reportableType="user"
      />
      
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        username={user.username}
        type={followModalType}
      />
    </div>
  );
}
