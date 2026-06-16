import React, { useState, useRef, useEffect } from 'react';
import { CoachMessage } from '../types';

interface CoachChatProps {
  messages: CoachMessage[];
  onSendMessage: (text: string) => Promise<void>;
}

export function CoachChat({ messages, onSendMessage }: CoachChatProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Suggested conversational starter chips
  const SUGESTIONS = [
    'How do I lower transport footprint without public transit?',
    'Explain the environmental cost of beef vs. vegetarian food.',
    'What are 3 quick things to check on my electric bills?',
    'How many trees are needed to offset 1 ton of CO2?',
  ];

  useEffect(() => {
    // Auto-scroll chats on message addition
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;
    setIsSending(true);
    setErrorText(null);
    try {
      await onSendMessage(textToSend);
      setInputText('');
    } catch (err) {
      console.error(err);
      setErrorText('I failed to synchronize with our carbon grid. Make sure the API secret key is correctly set!');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  return (
    <div className="bg-white rounded-2xl border border-natural-border/85 max-w-4xl mx-auto flex flex-col h-[600px] overflow-hidden shadow-xs" id="sustainability-coach-chat">
      
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-natural-border bg-natural-cream/35 flex items-center gap-3">
        <span className="w-10 h-10 bg-natural-cream rounded-full flex items-center justify-center text-xl border border-natural-border/40">🤖</span>
        <div>
          <h2 className="font-bold text-natural-moss text-sm md:text-base">AI Sustainability Advisor</h2>
          <p className="text-xs text-natural-muted font-semibold">Answers questions and designs action strategies in real-time.</p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 font-normal" ref={chatScrollContainerRef}>
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-natural-moss text-white rounded-tr-none font-medium' : 'bg-natural-cream/70 text-natural-text rounded-tl-none border border-natural-border/30 font-medium'}`}
              >
                {/* Parse simple markdown headers and lists inside text */}
                <div className="space-y-1 whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
                <span className={`block text-[10px] text-right mt-1.5 ${isUser ? 'text-[#E9EDC9] font-mono' : 'text-natural-muted font-mono'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-natural-cream/50 text-natural-text rounded-2xl rounded-tl-none border border-natural-border/30 px-4 py-3 text-sm flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-natural-moss/60 rounded-full animate-bounce" />
              <span className="inline-block w-2 h-2 bg-natural-moss/60 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 bg-natural-moss/60 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-natural-moss font-bold font-mono">Coach is calculating factors...</span>
            </div>
          </div>
        )}

        {errorText && (
          <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 text-xs rounded-xl font-medium" role="alert">
            ❌ {errorText}
          </div>
        )}
      </div>

      {/* Suggestion Starter Chips */}
      {messages.length <= 1 && !isSending && (
        <div className="px-6 py-3 bg-natural-cream/20 border-t border-natural-border space-y-2">
          <p className="text-[10px] text-natural-moss font-extrabold uppercase tracking-widest">Suggested Consultations</p>
          <div className="flex flex-wrap gap-2">
            {SUGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="bg-white border border-natural-border hover:border-natural-moss hover:bg-natural-cream/30 text-xs text-natural-text hover:text-natural-moss px-3 py-1.5 rounded-full cursor-pointer transition-all font-semibold active:scale-95 animate-fade-in"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Core */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-natural-border bg-natural-cream/30 rounded-b-2xl flex gap-3 text-sm">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask your climate coach a question (e.g. Can you audit clothes purchases?)..."
          className="flex-1 h-11 px-4 bg-white rounded-xl border border-natural-border focus:ring-2 focus:ring-natural-moss focus:border-natural-moss outline-hidden text-sm text-natural-text font-medium"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !inputText.trim()}
          className="px-5 h-11 bg-natural-moss hover:bg-natural-moss/90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          Send
        </button>
      </form>
    </div>
  );
}
