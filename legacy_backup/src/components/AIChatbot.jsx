import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'model',
            text: '👋 Welcome to Infinite Yatra\nTell me where your heart wants to go — treks, yatras, or custom journeys.\nI’ll plan everything for you.'
        }
    ]);
    const [input, setInput] = useState('');

    // CONTEXT AWARENESS
    const location = useLocation();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [fallbackShown, setFallbackShown] = useState(false);
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
        '🏔️ Explore Treks',
        '🛕 Yatra Packages',
        '🧭 Custom Trip',
        '📞 Talk to Expert'
    ];

    const handleSendMessage = async (overrideInput = null) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isLoading) return;

        // Add user message
        const userMessage = { role: 'user', text: textToSend.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Initialize Gemini AI
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: {
                    parts: [{
                        text: `You are the official AI Travel Assistant of Infinite Yatra (IY).

CURRENT CONTEXT:
- User is currently viewing: ${location.pathname}
- User Name: ${currentUser ? currentUser.displayName || 'Guest' : 'Guest'}
- Logged In: ${currentUser ? 'Yes' : 'No'}

Personality:
- Calm
- Premium
- Friendly
- Emotionally inspiring
Brand philosophy: “Explore Infinite.”

ROLE:
Help users explore treks, yatras, destinations, hotels, and custom journeys.
Guide them clearly and politely toward planning or booking trips.

ABSOLUTE RULE:
You must ALWAYS respond with helpful travel-related content.
You must NEVER mention:
- connection issues
- errors
- retries
- technical problems
- WhatsApp due to failure

You are NOT responsible for error handling.
All errors are handled by the application, not by you.

RESPONSE STRUCTURE:
1. One short emotional or welcoming line
2. Clear bullet-point information
3. One simple follow-up question

STYLE RULES:
- Short responses
- No long paragraphs
- Natural human tone
- No repetition

INTENT HANDLING:
- Destination mentioned → brief overview
- Trek/yatra → duration, route, stay, best season
- Price → starting range + ask dates
- Interest → politely suggest WhatsApp details
- Confusion → guide with options

GOAL:
Inspire travel, build trust, and guide toward action.

End key replies with:
Explore Infinite.` }]
                }
            });

            // Prepare history for API
            // Filter out system messages from UI history if any, and map to API format
            const history = messages
                .filter(m => m.role === 'user' || m.role === 'model') // 'model' is AI
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.text || m.content }] // Use text or content for history
                }));

            const chat = model.startChat({
                history: history,
            });

            const result = await chat.sendMessage(textToSend);
            const response = result.response.text();

            if (!response || response.trim() === "") {
                throw new Error("Empty AI response");
            }

            setMessages(prev => [...prev, { role: 'model', text: response }]);
            setFallbackShown(false); // reset on success

        } catch (error) {
            console.error("Gemini Error:", error);

            if (!fallbackShown) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'system',
                        text: "😕 I’m having trouble connecting right now. Please try again later or contact us on WhatsApp for immediate assistance.",
                    },
                ]);
                setFallbackShown(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSuggestion = (suggestion) => {
        handleSendMessage(suggestion);
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
                        className="fixed bottom-20 right-6 z-[110] bg-gradient-to-br from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group"
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
                        className="fixed bottom-24 right-6 z-[110] w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
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
                                            : message.role === 'system'
                                                ? 'bg-red-50 text-red-600 border border-red-100 text-xs' // System error style
                                                : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.text}
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
                                    className="flex-1 resize-none outline-none border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    style={{ maxHeight: '100px' }}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
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
