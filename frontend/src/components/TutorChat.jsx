import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, HelpCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

function formatMessage(text) {
    // bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[#0d1117] px-1 py-0.5 rounded text-blue-300 text-xs">$1</code>');
    // code blocks
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-[#0d1117] p-3 rounded my-2 overflow-x-auto text-xs"><code>$2</code></pre>');
    // newlines to br
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
}

export default function TutorChat({ onHelpClick, code, error, sessionId, condition, onStateInferred }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am AdaptTutor. I will be observing your progress and helping you out if you get stuck.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (overrideMessage = null) => {
        const textToSend = overrideMessage || input;
        if (!textToSend.trim()) return;

        const newMessages = [...messages, { role: 'user', content: textToSend }];
        setMessages(newMessages);
        if (!overrideMessage) setInput('');
        setIsTyping(true);

        try {
            const resp = await axios.post(`${API_URL}/api/chat`, {
                session_id: sessionId,
                message: textToSend,
                code: code,
                condition: condition,
                error: error || "",
                chat_history: newMessages.slice(1) // skip initial greeting
            });
            setMessages([...newMessages, { role: 'assistant', content: resp.data.response }]);
            if (resp.data.inferred_state && onStateInferred) {
                onStateInferred(resp.data.inferred_state);
            }
        } catch (err) {
            setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my server right now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const localHandleHelpClick = () => {
        onHelpClick();
        handleSend("I'm stuck. Can you give me a hint based on my current code and any errors?");
    };

    return (
        <div className="flex flex-col h-full bg-[#161b22] border-l border-[#30363d] w-1/4">
            <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bot size={24} className="text-blue-400" /> Tutor Profile
                </h2>
                <button
                    onClick={localHandleHelpClick}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors text-sm font-semibold"
                >
                    <HelpCircle size={16} /> I'm Stuck!
                </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-[#238636]'
                            }`}>
                            {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                        </div>
                        <div
                            className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user'
                                ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-none'
                                : 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-tl-none'
                                }`}
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        />
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#238636]">
                            <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                        <div className="p-3 rounded-lg max-w-[85%] text-sm bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-tl-none italic text-gray-400">
                            AdaptTutor is thinking...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-[#30363d]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for a hint..."
                        className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={() => handleSend()}
                        className="bg-[#238636] hover:bg-[#2ea043] text-white p-2 rounded transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}