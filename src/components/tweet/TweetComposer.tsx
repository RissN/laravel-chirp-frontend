import React, { useState, useRef } from 'react';
import { Image, Smile, Plus, ListTodo, CalendarClock, MapPin, Paperclip, FileText, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { createTweet, replyToTweet } from '../../api/tweets';
import { useToast } from '../ui/ToastProvider';
import api from '../../api/axios';

/**
 * Props untuk komponen TweetComposer.
 *
 * @property isReply - Apakah composer ini untuk membalas tweet (default: false)
 * @property parentId - ID tweet yang dibalas (wajib jika isReply=true)
 * @property isModal - Apakah ditampilkan di dalam modal popup (default: false)
 * @property onSuccessCallback - Callback yang dipanggil setelah berhasil mengirim
 * @property replyingTo - Username user yang dibalas (untuk label "Replying to")
 */
interface TweetComposerProps {
  isReply?: boolean;
  parentId?: number;
  isModal?: boolean;
  onSuccessCallback?: () => void;
  replyingTo?: string;
}

/**
 * Komponen TweetComposer - Form untuk membuat tweet atau reply baru.
 *
 * Fitur utama:
 * - Input teks dengan batasan maksimum 250 karakter
 * - Upload gambar (maks 4 file, format: JPEG, PNG, GIF)
 * - Upload file dokumen via tombol Attach (PDF, DOC, ZIP, TXT, dll)
 * - Preview gambar dengan grid layout responsif
 * - Preview file dengan nama dan ukuran
 * - Karakter counter dengan indikator warna (kuning saat mendekati limit, merah saat melebihi)
 * - Mode collapsed/expanded untuk inline reply
 * - Upload media ke server secara sequential sebelum submit
 *
 * @param props - Konfigurasi composer (lihat TweetComposerProps)
 */
export default function TweetComposer({ isReply = false, parentId, isModal = false, onSuccessCallback, replyingTo }: TweetComposerProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const tweetMutation = useMutation({
    mutationFn: (data: {content?: string, media?: string[]}) => {
      if (isReply && parentId) {
        return replyToTweet(parentId, data);
      }
      return createTweet(data);
    },
    onSuccess: () => {
      setContent('');
      setImages([]);
      setFiles([]);
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-for-you'] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: ['profile-tweets', user.username] });
      }
      if (isReply) {
        queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
        queryClient.invalidateQueries({ queryKey: ['replies', String(parentId)] });
        queryClient.invalidateQueries({ queryKey: ['tweet', String(parentId)] });
      }
      showToast(isReply ? 'Reply sent' : 'Sent!', 'success');
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: () => {
      showToast('Failed to post tweet', 'error');
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 4 - images.length);
      setImages([...images, ...filesArray]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 4 - files.length);
      setFiles([...files, ...filesArray]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0 && files.length === 0) return;

    setIsUploading(true);
    let uploadedMediaUrls: string[] = [];

    // Upload media sequentially (images + files)
    try {
      for (const file of images) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', 'tweet');
        
        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMediaUrls.push(res.data.data.url);
      }

      for (const file of files) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', 'tweet');
        
        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMediaUrls.push(res.data.data.url);
      }

      tweetMutation.mutate({
        content: content.trim(),
        media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined
      });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const charCount = content.length;
  const isOverLimit = charCount > 250;
  const isNearLimit = charCount >= 230;
  const isDisabled = isOverLimit || (!content.trim() && images.length === 0 && files.length === 0) || tweetMutation.isPending || isUploading;

  if (!user) return null;

  // Collapsed reply bar (only for inline replies, not in modal)
  const showCollapsed = isReply && !isModal && !isExpanded && content.length === 0;

  if (showCollapsed) {
    return (
      <div 
        className="p-4 border-b border-[var(--border-color)] cursor-text bg-transparent"
        onClick={handleExpandClick}
      >
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || 'User'} src={user?.avatar} size="md" linkToProfile={false} />
          <div className="flex-1 min-w-0 flex items-center pt-1">
            <span className="text-[var(--text-muted)] text-[18px]">Post your reply</span>
          </div>
          <button 
            className="px-6 py-2 rounded-full bg-[var(--text-muted)]/30 text-[var(--text-muted)] text-[15px] font-bold cursor-default"
            disabled
          >
            Reply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border-b border-[var(--border-color)] ${isReply && !isModal ? '' : isModal ? '' : 'animate-fade-in'}`}>
      {/* Replying to indicator */}
      {isReply && replyingTo && !isModal && (
        <div className="mb-3 ml-14 text-[13px] text-[var(--text-muted)]">
          Replying to <span className="text-[var(--color-chirp)] hover:underline cursor-pointer">@{replyingTo}</span>
        </div>
      )}
      <div className="flex gap-4">
        <Avatar name={user?.name || 'User'} src={user?.avatar} size="md" linkToProfile={false} />
        
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none text-[20px] text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:ring-0 resize-none min-h-[50px] py-1 leading-tight outline-none"
            placeholder={isReply ? "Post your reply" : "What's happening?"}
            rows={Math.max(1, content.split('\n').length)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className={`mt-3 grid gap-2 rounded-2xl overflow-hidden border border-[var(--border-color)]/30 ${
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {images.map((file, i) => (
                <div key={i} className="relative group/img aspect-video sm:aspect-square overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                  <button 
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Attachments Preview */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--hover-bg)] border border-[var(--border-color)]/20">
                  <FileText size={20} className="text-[var(--color-chirp)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-color)] text-sm font-medium truncate">{file.name}</p>
                    <p className="text-[var(--text-muted)] text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]/10">
            <div className="flex items-center -ml-2 text-[var(--color-chirp)]">
              {/* Media */}
              <label className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 cursor-pointer transition-colors group/tool relative">
                <Image size={20} strokeWidth={2.2} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={images.length >= 4} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Media</span>
              </label>

              {/* File Attachment */}
              <label className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 cursor-pointer transition-colors group/tool relative">
                <Paperclip size={20} strokeWidth={2.2} />
                <input type="file" multiple accept=".pdf,.doc,.docx,.zip,.txt,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={handleFileChange} disabled={files.length >= 4} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Attach File</span>
              </label>

              {/* GIF */}
              <button disabled className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative opacity-60">
                <div className="border-[1.5px] border-current rounded-[4px] px-[2px] text-[9px] font-extrabold leading-none h-[18px] flex items-center justify-center tracking-tighter">GIF</div>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">GIF</span>
              </button>

              {/* Poll */}
              <button disabled className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative opacity-60">
                <ListTodo size={20} strokeWidth={2.2} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Poll</span>
              </button>

              {/* Emoji */}
              <button className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative">
                <Smile size={20} strokeWidth={2.2} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Emoji</span>
              </button>

              {/* Schedule */}
              <button disabled className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative opacity-60">
                <CalendarClock size={20} strokeWidth={2.2} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Schedule</span>
              </button>

              {/* Location */}
              <button disabled className="p-2.5 rounded-full hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative opacity-60">
                <MapPin size={20} strokeWidth={2.2} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Location</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {charCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-8 rounded-full ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-[var(--color-chirp)]/30'}`} />
                  <span className={`text-[12px] font-bold ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-[var(--text-muted)]'}`}>
                    {250 - charCount}
                  </span>
                </div>
              )}
              <Button 
                onClick={handlePost} 
                disabled={isDisabled}
                isLoading={tweetMutation.isPending || isUploading}
                size="sm"
                className="px-6 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all font-bold tracking-wide"
              >
                {isReply ? 'Reply' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
