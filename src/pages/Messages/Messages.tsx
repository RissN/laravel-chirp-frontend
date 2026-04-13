import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Settings, Send, Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { getConversations, getMessages, sendMessage, markAsRead } from '../../api/conversations';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';
import NewMessageModal from '../../components/messages/NewMessageModal';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Messages() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activePartner, setActivePartner] = useState<any>(null);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Conversation List
  const { data: conversationsData, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations
  });

  // Fetch specific thread
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => getMessages(activeConvId!),
    enabled: !!activeConvId,
    staleTime: 0
  });

  // Real-time Echo Listener
  useEffect(() => {
    if (!user) return;

    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.private(`user.${user.id}.messages`);
    
    channel.listen('.message.new', (e: any) => {
        const newMessage = e.message;
        
        // 1. Update conversations list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        // 2. If it belongs to active conversation, append it
        // Note: activePartner.id is the other user's ID
        if (activePartner && 
           (newMessage.sender_id === activePartner.id || newMessage.sender_id === user.id)) {
            
            queryClient.setQueryData(['messages', activeConvId], (oldData: any) => {
              if (!oldData) return oldData;
              
              // Prevent duplicates if it was already added by mutation
              if (oldData.data.find((m: any) => m.id === newMessage.id)) return oldData;

              return {
                ...oldData,
                data: [newMessage, ...oldData.data]
              };
            });
            
            // Mark as read if active
            if (newMessage.sender_id !== user.id && activeConvId) {
                markAsRead(activeConvId);
            }
        }
    });

    return () => {
      echo.leave(`user.${user.id}.messages`);
    };
  }, [user, activeConvId, activePartner, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activePartner.id, content),
    onSuccess: (data) => {
      setMessageInput('');
      const sentMessage = data.data;

      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (activeConvId) {
        queryClient.setQueryData(['messages', activeConvId], (oldData: any) => {
          if (!oldData) return oldData;
          
          if (oldData.data.find((m: any) => m.id === sentMessage.id)) return oldData;

          return {
            ...oldData,
            data: [sentMessage, ...oldData.data]
          };
        });
      } else if (sentMessage.conversation_id) {
          setActiveConvId(sentMessage.conversation_id);
          queryClient.invalidateQueries({ queryKey: ['messages', sentMessage.conversation_id] });
      }
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData?.data]);

  const handleSelectConversation = (conv: any) => {
    setActivePartner(conv.other_user);
    setActiveConvId(conv.id);
    if (conv.unread_count > 0) {
      markAsRead(conv.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  };

  const handleSelectUserFromModal = (selectedUser: any) => {
    const existingConv = conversationsData?.data?.find(
        (c: any) => c.other_user.id === selectedUser.id
    );

    if (existingConv) {
        handleSelectConversation(existingConv);
    } else {
        setActivePartner(selectedUser);
        setActiveConvId(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartner) return;
    sendMutation.mutate(messageInput.trim());
  };

  return (
    <div className="flex h-screen bg-[var(--bg-color)] overflow-hidden">
      {/* Inbox List */}
      <aside className={`w-full xl:w-[400px] border-r border-[var(--border-color)]/30 flex flex-col transition-all duration-300 ${activeConvId || activePartner ? 'hidden xl:flex' : 'flex'}`}>
        <div className="sticky-header px-5 py-4 flex justify-between items-center bg-white/70 dark:bg-[#0a0a1a]/70 backdrop-blur-xl">
            <h1 className="h-lg text-[var(--text-color)]">Messages</h1>
            <div className="flex items-center gap-1">
                <button className="action-icon-btn action-icon-btn-blue"><Settings size={18} /></button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="action-icon-btn action-icon-btn-blue"
                >
                  <Mail size={18} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pt-2">
          {isConvLoading ? (
             <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
          ) : conversationsData?.data?.length === 0 ? (
             <div className="p-10 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[var(--hover-bg)] flex items-center justify-center mx-auto mb-4">
                    <Mail size={30} className="text-[var(--text-muted)] opacity-50" />
                </div>
                <h3 className="text-[20px] font-black text-[var(--text-color)] mb-2">Welcome to your inbox!</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6 px-4">Start messaging with friends to see them here.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn-gradient px-8 py-3 rounded-full font-black tracking-wide shadow-lg"
                >
                  Write a message
                </button>
             </div>
          ) : (
            conversationsData?.data?.map((conv: any) => (
              <div 
                key={conv.id} 
                onClick={() => handleSelectConversation(conv)}
                className={`flex gap-3 px-5 py-4 cursor-pointer transition-all duration-300 relative group
                  ${activeConvId === conv.id ? 'bg-[var(--hover-bg)]/40 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[var(--color-chirp)]' : 'hover:bg-[var(--hover-bg)]/20'}`}
              >
                <Avatar name={conv.other_user.name} src={conv.other_user.avatar} size="md" linkToProfile={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-bold text-[15px] truncate text-[var(--text-color)]">{conv.other_user.name}</p>
                        <p className="text-[13px] text-[var(--text-muted)] truncate font-medium">@{conv.other_user.username}</p>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold whitespace-nowrap">
                        {conv.last_message ? formatDistanceToNowStrict(new Date(conv.last_message.created_at)) : ''}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-[14px] truncate ${conv.unread_count > 0 ? 'text-[var(--text-color)] font-bold' : 'text-[var(--text-muted)]'}`}>
                        {conv.last_message?.content || 'No messages'}
                    </p>
                    {conv.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-chirp)] flex items-center justify-center animate-pulse">
                            <span className="text-[10px] text-white font-black">{conv.unread_count}</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Conversation Thread */}
      <main className={`flex-1 flex flex-col bg-[var(--bg-color)] relative transition-all duration-300 ${!activePartner ? 'hidden xl:flex' : 'flex'}`}>
        {!activePartner ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in bg-mesh">
             <div className="max-w-[400px]">
                <h2 className="text-[32px] font-black text-[var(--text-color)] leading-tight mb-3">Select a message</h2>
                <p className="text-[var(--text-muted)] mb-8 font-medium">
                  Choose from your existing conversations, start a new one, or just keep swimming. 
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn-gradient px-10 py-4 rounded-full font-black tracking-wide text-[16px] shadow-xl hover:scale-105 transition-transform"
                >
                  New message
                </button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            <header className="sticky-header px-5 py-3 flex items-center justify-between shadow-sm z-20 bg-white/70 dark:bg-[#0a0a1a]/70 backdrop-blur-xl">
               <div className="flex items-center gap-3">
                  <button className="xl:hidden action-icon-btn action-icon-btn-blue mr-1" onClick={() => { setActiveConvId(null); setActivePartner(null); }}>
                     <ArrowLeft size={20} />
                  </button>
                  <Avatar name={activePartner.name} src={activePartner.avatar} size="sm" username={activePartner.username} />
                  <div>
                    <h2 className="font-extrabold text-[16px] leading-tight text-[var(--text-color)]">{activePartner.name}</h2>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">@{activePartner.username}</p>
                  </div>
               </div>
               <button className="action-icon-btn action-icon-btn-blue"><MoreHorizontal size={20} /></button>
            </header>

            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col-reverse hide-scrollbar scroll-smooth"
              ref={chatContainerRef}
            >
               <div ref={messagesEndRef} />
               <AnimatePresence>
               {isMessagesLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={32} /></div>
               ) : messagesData?.data && messagesData.data.length > 0 ? (
                  messagesData.data.map((msg: any) => {
                     const isMine = msg.sender_id === user?.id;
                     return (
                        <motion.div 
                          key={msg.id} 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                           <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-[15px] shadow-sm
                              ${isMine 
                                ? 'bg-gradient-to-r from-[#1da1f2] to-[#6366f1] text-white rounded-br-sm' 
                                : 'bg-[var(--hover-bg)]/80 backdrop-blur-sm text-[var(--text-color)] rounded-bl-sm border border-[var(--border-color)]/20 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]'}`}>
                             {msg.content}
                             <p className={`text-[9px] mt-1 font-bold ${isMine ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                {formatDistanceToNowStrict(new Date(msg.created_at))} ago
                             </p>
                           </div>
                        </motion.div>
                     )
                  })
               ) : (
                  <div className="text-center p-12 animate-fade-in my-auto">
                    <div className="w-20 h-20 rounded-full bg-[var(--hover-bg)] ring-4 ring-[var(--color-chirp)]/10 flex items-center justify-center mx-auto mb-6">
                        <Avatar name={activePartner.name} src={activePartner.avatar} size="lg" linkToProfile={false} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--text-color)] mb-1">{activePartner.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6 font-bold">@{activePartner.username}</p>
                    <div className="divider mb-6 max-w-[200px] mx-auto opacity-20" />
                    <p className="text-[var(--text-muted)] font-medium">Say hi to start the conversation!</p>
                  </div>
               )}
               </AnimatePresence>
            </div>

            <footer className="p-4 border-t border-[var(--border-color)]/30 bg-[var(--bg-color)]/80 backdrop-blur-md">
               <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-[var(--hover-bg)]/40 rounded-2xl px-2 py-1.5 border border-transparent focus-within:border-[var(--color-chirp)]/30 focus-within:bg-transparent transition-all duration-300 shadow-inner">
                 <input 
                   disabled={sendMutation.isPending}
                   type="text" 
                   value={messageInput}
                   onChange={(e) => setMessageInput(e.target.value)}
                   placeholder="Start a new message"
                   className="flex-1 bg-transparent border-none focus:ring-0 outline-none p-3 text-[15px] font-medium text-[var(--text-color)] placeholder:text-[var(--text-muted)]"
                 />
                 <button 
                   type="submit" 
                   disabled={!messageInput.trim() || sendMutation.isPending}
                   className="p-3 bg-white text-[var(--color-chirp)] hover:bg-gray-50 border border-gray-100 rounded-xl disabled:opacity-50 disabled:grayscale transition-all shadow-sm active:scale-95"
                 >
                   {sendMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                 </button>
               </form>
            </footer>
          </div>
        )}
      </main>

      <NewMessageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectUser={handleSelectUserFromModal}
      />
    </div>
  );
}
