import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI travel assistant. Ask me anything about our treks, packages, or destinations!'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Quick suggestion buttons
    const quickSuggestions = [
        'What treks are available?',
        'Best time for Kedarkantha?',
        'Group booking discounts?',
        'What\'s included in packages?'
    ];

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Initialize Gemini AI
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Context about Infinite Yatra
            const context = `You are a helpful AI assistant for Infinite Yatra, an adventure travel company specializing in Himalayan treks and spiritual journeys in India. 

Our main packages include:
1. Kedarkantha Trek - 6 days, ₹6,000, Moderate difficulty, 12,500 ft altitude
2. Tungnath Trek - 4 days, ₹6,000, Easy to Moderate, 13,000 ft altitude
3. Chardham Yatra 2026 - 10 days, ₹35,000, visits Gangotri, Yamunotri, Kedarnath, Badrinath
4. Soul of Himalayas - 7 days, ₹18,000, includes Kedarnath, Tungnath, Badrinath, Rishikesh

We offer:
- Experienced trek leaders and guides
- All meals during treks
- Accommodation (tents/guesthouses)
- Safety equipment and first aid
- Transportation
- Forest permits

Best time for winter treks: December to April
Best time for Chardham: May to October

Answer questions about our treks, packages, booking process, what to pack, difficulty levels, and general travel advice. Be friendly, concise, and helpful. If asked about specific bookings or payments, direct them to contact us via WhatsApp or the booking page.`;

            const prompt = `${context}\n\nUser question: ${userMessage}\n\nProvide a helpful, friendly response:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiResponse = response.text();

            // Add AI response
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '😊 I\'m having trouble connecting right now. Please try asking again, or contact us directly via WhatsApp for immediate assistance!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSuggestion = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group"
                    >
                        <div className="relative">
                            <MessageCircle size={28} />
                            {/* Pulse animation */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                Ask AI Assistant
                                <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"></div>
                            </div>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">AI Travel Assistant</h3>
                                    <p className="text-xs text-white/80">Always here to help</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                                : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-blue-600" />
                                            <span className="text-sm text-slate-600">Thinking...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Suggestions */}
                        {messages.length === 1 && (
                            <div className="px-4 py-2 bg-white border-t border-slate-200">
                                <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickSuggestion(suggestion)}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything..."
                                    rows="1"
                                    className="flex-1 resize-none outline-none border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    style={{ maxHeight: '100px' }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isLoading}
                                    className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Powered by AI • Instant responses
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatbot;
