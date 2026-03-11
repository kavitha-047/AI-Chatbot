import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, Trash2, LogOut, Bot } from 'lucide-react';
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
            <aside className={`sidebar ${isOpen ? 'open' : ''} glass-effect`}>
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={onNewChat}>
                        <Plus size={20} />
                        <span>New Chat</span>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <h3 className="sidebar-section-title">History</h3>
                    {loading ? (
                        <div className="loading-history">
                            <span className="typing-indicator">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </span>
                        </div>
                    ) : conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                className={`conversation-item ${currentId === conv.id ? 'active' : ''}`}
                                onClick={() => onSelect(conv.id)}
                            >
                                <MessageSquare size={16} />
                                <span className="truncate">{conv.title || "Untitled Chat"}</span>
                                {currentId === conv.id && (
                                    <Trash2
                                        size={14}
                                        className="delete-icon"
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                    />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="empty-history">
                            <p>No recent chats</p>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="version-info">
                        <Bot size={14} />
                        <span>Assistant v1.2</span>
                    </div>
                </div>
            </aside>

            <style jsx>{`
                .delete-icon {
                    margin-left: auto;
                    opacity: 0.4;
                    transition: all 0.2s;
                }
                .delete-icon:hover {
                    opacity: 1;
                    color: #ef4444;
                    transform: scale(1.1);
                }
                .empty-history {
                    padding: 2rem 1rem;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-style: italic;
                }
                .version-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.7rem;
                    font-weight: 500;
                }
                .truncate {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }
            `}</style>
        </>
    );
}


export default Sidebar;
