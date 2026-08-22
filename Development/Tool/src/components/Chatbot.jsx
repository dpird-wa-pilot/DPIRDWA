import React, { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am the DPIRD Assistant. How can I help you today with information about DPIRD programs, grants, or services?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Our servers are currently experiencing high demand. Please try again in a few moments');
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      console.error('Chat error:', err);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.15)] mb-4 w-[calc(100vw-3rem)] max-w-[360px] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right animate-in fade-in zoom-in-95">

          {/* Header */}
          <div className="bg-primary text-on-primary p-md flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined">smart_toy</span>
              <span className="font-headline-md text-[16px] font-bold">DPIRD Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-on-primary/80 hover:text-on-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary-container"
              aria-label="Close Chat"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Privacy Warning Banner */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-2.5 px-3 flex items-start gap-2 text-amber-800 text-[11px] leading-snug">
            <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">warning</span>
            <div>
              <strong>Privacy Notice (Pilot):</strong> In the free version of the Gemini API, Google may use interactions to train its models. Please do not share any confidential or sensitive information.
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-md flex flex-col gap-md h-[360px] overflow-y-auto bg-surface-container-lowest">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-xs ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`p-sm rounded-lg font-body-md text-[14px] ${
                  msg.role === 'user'
                    ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                    : msg.isError
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 rounded-tl-none'
                    : 'bg-surface-container-high text-on-surface rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 self-start">
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-sm border-t border-outline-variant bg-surface-container-low flex gap-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 font-body-md text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary text-on-primary h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary text-on-secondary w-14 h-14 rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:scale-105 hover:bg-secondary-container hover:text-on-secondary-container transition-all"
        aria-label="Toggle Chatbot"
      >
        <span className="material-symbols-outlined text-[28px]">
          {isOpen ? 'expand_more' : 'chat'}
        </span>
      </button>
    </div>
  );
}
