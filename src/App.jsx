import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Settings } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { getGeminiResponse } from './lib/gemini';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: 'Hello! I am your professional AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Show instantly in UI
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 🔥 Save user message to Supabase
      const { error: supabaseError } = await supabase
        .from('messages')
        .insert([
          {
            role: 'user',
            content: userText,
            conversation_id: null
          }
        ]);

      if (supabaseError) {
        console.error("Supabase error (user message):", supabaseError);
      }

      // 🤖 Get Gemini Response
      const aiResponse = await getGeminiResponse(userText);

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // 🔥 Save bot response to Supabase
      const { error: botSupabaseError } = await supabase
        .from('messages')
        .insert([
          {
            role: 'bot',
            content: aiResponse,
            conversation_id: null
          }
        ]);

      if (botSupabaseError) {
        console.error("Supabase error (bot message):", botSupabaseError);
      }

    } catch (err) {
      console.error("Error in handleSend:", err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-info">
          <div className="bot-avatar-large">
            <Bot size={24} />
          </div>
          <div className="header-titles">
            <h1>Professional AI Assistant</h1>
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
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.role}`}>
            <div className="message-content-box">
              <div className={`avatar-small ${msg.role}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-bubble">
                <p className="message-text">{msg.content}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper bot">
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
          </div>
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
          Professional AI Chatbot • Powered by React & Supabase
        </p>
      </footer>
    </div>
  );
}

export default App;