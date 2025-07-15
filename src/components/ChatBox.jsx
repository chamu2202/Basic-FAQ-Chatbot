import React, { useState, useEffect, useRef } from "react";
import faqPatterns, { fallbackResponse } from "../data/faqPatterns";

// Import sound (put sound.mp3 in your public folder)
const botSound = new Audio("/sound.mp3");

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const chatEndRef = useRef(null);

  // Load saved data on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));

    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) setChatHistory(JSON.parse(savedHistory));

    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Apply dark mode class on body
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = {
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString(),
      reaction: null
    };

    const updatedMessages = [...messages, userMessage];
    const updatedHistory = [...chatHistory, userMessage];

    setMessages(updatedMessages);
    setChatHistory(updatedHistory);

    localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

    setInput("");
    generateResponse(input, updatedMessages, updatedHistory);
  };

  const generateResponse = (text, currentMessages, currentHistory) => {
    setTyping(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      const matched = faqPatterns.find(item =>
        item.patterns.some(pattern => lower.includes(pattern))
      );
      const botText = matched ? matched.response : fallbackResponse;

      const botMessage = {
        sender: "bot",
        text: botText,
        timestamp: new Date().toLocaleTimeString(),
        reaction: null
      };

      const updatedMessages = [...currentMessages, botMessage];
      const updatedHistory = [...currentHistory, botMessage];

      setMessages(updatedMessages);
      setChatHistory(updatedHistory);

      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      botSound.play(); // Play sound
      setTyping(false);
    }, 1000);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
    // chatHistory stays
  };

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = "chat_history.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addReaction = (index, reaction) => {
    const updated = [...messages];
    updated[index].reaction = reaction;
    setMessages(updated);
    localStorage.setItem("chatMessages", JSON.stringify(updated));

    // Also update in history
    const historyIdx = chatHistory.findIndex((msg) =>
      msg.timestamp === updated[index].timestamp &&
      msg.sender === updated[index].sender &&
      msg.text === updated[index].text
    );
    if (historyIdx !== -1) {
      const updatedHistory = [...chatHistory];
      updatedHistory[historyIdx].reaction = reaction;
      setChatHistory(updatedHistory);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    }
  };

  return (
    <div>
      <div className="max-w-md mx-auto p-4 border rounded shadow bg-white dark:bg-gray-800">
        {/* Top controls */}
        <div className="flex justify-between mb-2">
          <button onClick={toggleTheme} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>
          <button onClick={exportHistory} className="text-xs bg-green-500 text-white px-2 py-1 rounded">
            Export History
          </button>
        </div>

        {/* Chat area */}
        <div className="h-80 overflow-y-auto mb-2 border rounded p-2 bg-gray-50 dark:bg-gray-900">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
              <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-600 text-sm">
                {msg.text}
              </span>
              <div className="flex items-center text-xs text-gray-500 justify-end space-x-1">
                <span>{msg.timestamp}</span>
                <button onClick={() => addReaction(idx, "👍")}>👍</button>
                <button onClick={() => addReaction(idx, "👎")}>👎</button>
                {msg.reaction && <span>{msg.reaction}</span>}
              </div>
            </div>
          ))}
          {typing && <div className="text-xs text-gray-400 italic animate-pulse">Bot is typing...</div>}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input area */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            className="flex-1 border px-2 py-1 rounded text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
          />
          <button onClick={handleSend} className="bg-blue-500 text-white px-3 rounded">Send</button>
          <button onClick={clearChat} className="bg-gray-300 text-black px-2 rounded">Clear</button>
        </div>

        {/* History area */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">History</h3>
          <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-900">
            {chatHistory.length === 0 ? (
              <div className="text-xs text-gray-500">No chat history yet.</div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className="mb-1">
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    [{msg.timestamp}] <b>{msg.sender}:</b> {msg.text} {msg.reaction && <>{msg.reaction}</>}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
