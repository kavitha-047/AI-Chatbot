import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { supabase } from './lib/supabaseClient';
import { getGeminiResponse } from './lib/gemini';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔄 Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      fetchMessages(currentConversationId);
    } else {
      // Default welcome state for a fresh chat
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          content: 'Hello! I am your professional AI assistant. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [currentConversationId]);

  const fetchMessages = async (id) => {
    setIsHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Supabase fetchMessages error:", error.message, error.details);
        throw error;
      }

      setMessages(data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      })));
    } catch (err) {
      console.error("Error in fetchMessages:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let convId = currentConversationId;

      // 1. Create conversation if it doesn't exist
      if (!convId) {
        const chatTitle = userText.substring(0, 40) + (userText.length > 40 ? '...' : '');
        console.log("Creating new conversation with title:", chatTitle);

        const { data, error } = await supabase
          .from('conversations')
          .insert([{ title: chatTitle }])
          .select()
          .single();

        if (error) {
          console.error("Supabase create conversation error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Failed to create conversation: ${error.message}`);
        }

        if (!data) {
          throw new Error("Conversation created but no data returned.");
        }

        convId = data.id;
        setCurrentConversationId(convId);
        console.log("Conversation created successfully, ID:", convId);
      }

      // 2. Save user message
      console.log("Saving user message...");
      const { error: userMsgError } = await supabase.from('messages').insert([{
        role: 'user',
        content: userText,
        conversation_id: convId
      }]);

      if (userMsgError) {
        console.error("Supabase save user message error:", userMsgError.message, userMsgError.details);
        throw userMsgError;
      }

      // 3. Get AI response
      console.log("Calling Gemini API...");
      const aiResponse = await getGeminiResponse(userText);

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // 4. Save bot response
      console.log("Saving bot response...");
      const { error: botMsgError } = await supabase.from('messages').insert([{
        role: 'bot',
        content: aiResponse,
        conversation_id: convId
      }]);

      if (botMsgError) {
        console.error("Supabase save bot response error:", botMsgError.message, botMsgError.details);
        throw botMsgError;
      }

    } catch (err) {
      console.error("Detailed handleSend Error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: `Sorry, I hit an error: ${err.message || "Unknown error"}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        content: 'Hello! I am your professional AI assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentId={currentConversationId}
        onSelect={setCurrentConversationId}
        onNewChat={handleNewChat}
      />

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-info">
            <div className="bot-avatar-large">
              <Bot size={24} />
            </div>
            <div className="header-titles">
              <h1>AI ChatBot</h1>
              <p className="status-online">
                <span className="status-dot"></span> Online
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button" title="Settings">
              <Settings size={20} color="#64748b" />
            </button>
          </div>
        </header>

        <main className="messages-area">
          {isHistoryLoading ? (
            <div className="loading-history">Loading chat...</div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`message-wrapper ${msg.role}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="message-content-box">
                    <div className={`avatar-small ${msg.role}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="message-bubble">
                      <div className="message-text">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              className="message-wrapper bot"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="message-content-box">
                <div className="avatar-small bot">
                  <Bot size={16} />
                </div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="input-area">
          <form onSubmit={handleSend} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="chat-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="send-button"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="footer-note">
            AI Chatbot • Powered by React & Supabase
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;