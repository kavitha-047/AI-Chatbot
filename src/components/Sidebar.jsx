import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function Sidebar({ currentId, onSelect, onNewChat, isOpen, onClose }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();

        // Subscribe to changes
        const subscription = supabase
            .channel('conversations_changes')
            .on('postgres_changes', { event: '*', table: 'conversations' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteConversation = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            if (currentId === id) onNewChat();
        } catch (err) {
            console.error("Error deleting conversation:", err);
        }
    };

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={onNewChat}>
                        <Plus size={18} />
                        New Chat
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <h3 className="sidebar-section-title">Recent Chats</h3>
                    {loading ? (
                        <p className="loading-history">Loading...</p>
                    ) : conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                className={`conversation-item ${currentId === conv.id ? 'active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                            >
                                <MessageSquare size={16} />
                                <span className="truncate">{conv.title || "New Chat"}</span>
                                {currentId === conv.id && (
                                    <Trash2
                                        size={14}
                                        className="ml-auto opacity-50 hover:opacity-100"
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                    />
                                )}
                            </button>
                        ))
                    ) : (
                        <p className="p-4 text-xs text-slate-500 italic">No previous chats</p>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <p className="text-xs text-slate-500">AI Chatbot v1.0</p>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
