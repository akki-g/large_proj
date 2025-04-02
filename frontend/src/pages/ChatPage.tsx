import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import './ChatPage.css';
// Import the markdown rendering library and its types
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';

// Constants
const API_BASE_URL = 'https://api.scuba2havefun.xyz/api';

// Define interface for message
interface Message {
  content: string;
  sender: 'user' | 'assistant';
  timestamp?: Date;
}

// Define interface for chat
interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<{ _id: string; title: string; lastUpdated: Date }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for educational context
  const [classes, setClasses] = useState<any[]>([]);
  const [showEducationalContext, setShowEducationalContext] = useState<boolean>(false);

  // Define markdown components
  const markdownComponents: Components = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      
      if (!isInline) {
        const language = match ? match[1] : '';
        const codeContent = String(children).replace(/\n$/, '');
        
        const copyToClipboard = () => {
          navigator.clipboard.writeText(codeContent);
        };
        
        return (
          <div className="code-block-container">
            <div className="code-block-header">
              <span className="code-language">{language}</span>
              <button 
                className="copy-code-btn"
                onClick={copyToClipboard}
              >
                Copy
              </button>
            </div>
            <pre>
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
        );
      }
      
      return (
        <code className={className} {...props}>{children}</code>
      );
    }
  };

  // Check if user is logged in and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchChats();
      fetchClasses(); // Fetch user's classes for context
    }
  }, [navigate]);
  
  // Fetch user's classes
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/classes/allClasses`, {
        params: { token }
      });
      
      if (response.data && response.data.classes) {
        setClasses(response.data.classes);
      }
      
      // Save the refreshed token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat]);

  // Fetch all user chats
  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/list`, {
        params: { jwtToken: token }
      });
      setChats(response.data.chats);
      
      // Save the refreshed token
      if (response.data.jwtToken) {
        localStorage.setItem('token', response.data.jwtToken);
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(err.response?.data?.msg || 'Failed to load chats');
    }
  };

  // Load a specific chat
  const loadChat = async (chatId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/detail`, {
        params: { chatId, jwtToken: token }
      });
      setCurrentChat(response.data.chat);
      
      // Save the refreshed token
      if (response.data.jwtToken) {
        localStorage.setItem('token', response.data.jwtToken);
      }
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err.response?.data?.msg || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat
  const createNewChat = () => {
    setCurrentChat(null);
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { content: message, sender: 'user' as const };
    const messageText = message; // Store current message before clearing
    
    // Optimistically update UI
    setCurrentChat(prev => {
      if (prev) {
        return {
          ...prev,
          messages: [...prev.messages, userMessage]
        };
      }
      return {
        _id: 'temp-id',
        title: getDefaultChatTitle(messageText),
        messages: [userMessage],
        lastUpdated: new Date()
      };
    });
    
    setMessage('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/chat/send`, {
        message: messageText,
        chatId: currentChat?._id,
        jwtToken: token
      });
      
      setCurrentChat(response.data.chat);
      
      // If this was a new chat, refresh the chat list
      if (!currentChat?._id) {
        fetchChats();
      }
      
      // If we were in educational context view, switch back to chat view
      if (showEducationalContext) {
        setShowEducationalContext(false);
      }
      
      // Save the refreshed token
      if (response.data.jwtToken) {
        localStorage.setItem('token', response.data.jwtToken);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.msg || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate a default chat title from the first message
  const getDefaultChatTitle = (firstMessage: string) => {
    // Limit to first 30 chars of the message
    if (firstMessage.length <= 30) {
      return firstMessage;
    }
    return firstMessage.substring(0, 30) + '...';
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/chat/delete`, {
        chatId,
        jwtToken: token
      });
      
      // Remove from UI
      setChats(chats.filter(chat => chat._id !== chatId));
      
      // If current chat is deleted, reset
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
      }
    } catch (err: any) {
      console.error('Error deleting chat:', err);
      setError(err.response?.data?.msg || 'Failed to delete chat');
    }
  };

  // Format date for display
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to format a chat prompt with educational context
  const createContextualPrompt = (classId: string) => {
    const selectedClass = classes.find(c => c._id === classId);
    if (!selectedClass) return;
    
    // Set a prompt that asks about the specific class
    const prompt = `I need help understanding my ${selectedClass.name} (${selectedClass.number}) class. Can you provide an overview of what I should focus on based on my syllabus and chapters?`;
    
    // Set the message and send it automatically
    setMessage(prompt);

    // Not sending it automatically bc it was causing a page reload
    /*setTimeout(() => {
      // Create a synthetic form submit event
      const event = new Event('submit') as any;
      document.querySelector('.message-form')?.dispatchEvent(event);
    }, 100);*/
  };
  
  return (
    <div className="chat-page">
      <NavBar />
      <div className="chat-container">
        <div className="chat-sidebar">
          <button className="new-chat-btn" onClick={createNewChat}>
            + New Chat
          </button>
          
          <div className="sidebar-toggle">
            <button 
              className={`toggle-btn ${!showEducationalContext ? 'active' : ''}`}
              onClick={() => setShowEducationalContext(false)}
            >
              Chats
            </button>
            <button 
              className={`toggle-btn ${showEducationalContext ? 'active' : ''}`}
              onClick={() => setShowEducationalContext(true)}
            >
              My Classes
            </button>
          </div>
          
          {!showEducationalContext ? (
            <div className="chat-list">
              {chats.map(chat => (
                <div 
                  key={chat._id} 
                  className={`chat-item ${currentChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => loadChat(chat._id)}
                >
                  <div className="chat-title">{chat.title}</div>
                  <div className="chat-actions">
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat._id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="context-list">
              <h3>My Classes</h3>
              {classes.length === 0 ? (
                <p className="no-data">No classes found.</p>
              ) : (
                <div className="class-list">
                  {classes.map(cls => (
                    <div 
                      key={cls._id} 
                      className="class-item"
                      onClick={() => createContextualPrompt(cls._id)}
                    >
                      <div className="class-name">{cls.name}</div>
                      <div className="class-number">{cls.number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="chat-main">
          {error && <div className="error-message">{error}</div>}
          
          <div className="messages-container">
            {currentChat ? (
              <>
                {currentChat.messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <div className="message-content">
                      {msg.sender === 'assistant' ? (
                        <ReactMarkdown components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                    </div>
                    {msg.timestamp && (
                      <div className="message-timestamp">
                        {formatDate(msg.timestamp)}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="message assistant">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="welcome-message">
                <h2>Welcome to Syllab.AI Chat!</h2>
                <p>Ask me anything about your courses, syllabi, or study materials.</p>
              </div>
            )}
          </div>
          
          <form className="message-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;