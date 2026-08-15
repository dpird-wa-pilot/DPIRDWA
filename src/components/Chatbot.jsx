import React, { useState } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

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
              <strong>Aviso de Privacidad (Piloto):</strong> En la versión gratuita de Gemini API, Google puede utilizar las interacciones para entrenar sus modelos. <strong>No ingreses información personal o datos financieros confidenciales.</strong>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-md flex flex-col gap-md h-[360px] overflow-y-auto bg-surface-container-lowest">
            <div className="flex flex-col gap-xs max-w-[85%] self-start">
              <div className="bg-surface-container-high text-on-surface p-sm rounded-lg rounded-tl-none font-body-md text-[14px]">
                Hi! I'm your DPIRD digital assistant. How can I help you find resources or grants today?
              </div>
              <span className="text-[10px] text-on-surface-variant ml-1">Just now</span>
            </div>
            
            <div className="flex flex-col gap-xs max-w-[85%] self-end">
              <div className="bg-primary-container text-on-primary-container p-sm rounded-lg rounded-tr-none font-body-md text-[14px]">
                I'm looking for grants in the food sector.
              </div>
              <span className="text-[10px] text-on-surface-variant mr-1 self-end">Just now</span>
            </div>

            <div className="flex flex-col gap-xs max-w-[85%] self-start">
              <div className="bg-surface-container-high text-on-surface p-sm rounded-lg rounded-tl-none font-body-md text-[14px]">
                Great! We have several programs tailored for the Food Services sector. You can browse them on our <a href="/grants" className="text-primary font-bold hover:underline">Grants page</a> or I can summarize them for you.
              </div>
              <span className="text-[10px] text-on-surface-variant ml-1">Just now</span>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-sm border-t border-outline-variant bg-surface-container-low flex gap-sm">
            <input 
              type="text" 
              placeholder="Ask a question..." 
              className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 font-body-md text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button className="bg-primary text-on-primary h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors shrink-0">
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
