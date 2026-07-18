import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { getAIAdvice } from "../services/ai.service";
import { useToast } from "./ui";
import Loader from "./ui/Loader";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";

const FarmAssist = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I am FarmAssist, your AI agricultural advisor. How can I help you today?" },
  ]);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const { role } = useAuth();

  const markdownComponents = {
    p: ({node, ...props}) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-3" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-base font-bold mb-1 mt-2" {...props} />,
    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
    em: ({node, ...props}) => <em className="italic" {...props} />,
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    
    // Build chat history for the API
    // Map our 'ai' role to Groq's expected 'assistant' role
    const history = messages
      .filter(msg => msg.role === "user" || msg.role === "ai")
      .map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }));
    
    // Add current user message
    history.push({ role: "user", content: userMessage });

    // Keep only the last 10 messages to avoid context limits
    const trimmedHistory = history.slice(-10);

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await getAIAdvice(trimmedHistory);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.data.advice },
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get AI advice");
    } finally {
      setIsLoading(false);
    }
  };

  if (role !== "FARMER_GROUP" && role !== "COLLECTIVE") {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 z-50"
        title="FarmAssist AI"
      >
        <Icon icon={isOpen ? "material-symbols:close" : "ph:plant-fill"} className="w-7 h-7" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-40 right-6 md:bottom-28 md:right-8 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:robot-outline" className="w-6 h-6" />
                <h3 className="font-semibold text-base">FarmAssist AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-emerald-200">
                <Icon icon="material-symbols:close" className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 self-end rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 self-start rounded-tl-none shadow-sm"
                  }`}
                >
                  <div className="break-words">
                    <ReactMarkdown components={markdownComponents}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="bg-white border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 p-3 rounded-xl rounded-tl-none self-start max-w-[80%] flex items-center gap-2 shadow-sm">
                  <div className="scale-75 origin-left">
                    <Loader size="sm" />
                  </div>
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about crops, soil, etc..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              >
                <Icon icon="material-symbols:send-rounded" className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FarmAssist;
