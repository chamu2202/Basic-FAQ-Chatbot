import React, { useState, useEffect, useRef } from "react";
import faqPatterns, { fallbackResponse } from "../data/faqPatterns";

const botSound = new Audio("/sound.mp3");

const ChatBox = () => {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [waitingForName, setWaitingForName] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    const savedName = localStorage.getItem("username");

    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setChatHistory(parsedHistory);
      updateUsersList(parsedHistory);

      if (savedName) {
        setUsername(savedName);
        setWaitingForName(false);
        const userMsgs = parsedHistory.filter(
          msg => msg.sender === savedName || msg.forUser === savedName
        );
        setMessages(userMsgs);
        localStorage.setItem("chatMessages", JSON.stringify(userMsgs));
      }
    }

    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ✅ updated: only load if user exists; do not create new user
  useEffect(() => {
    const trimmed = selectedUser.trim();
    if (!trimmed) return;

    if (allUsers.includes(trimmed)) {
      const userMsgs = chatHistory.filter(
        msg => msg.sender === trimmed || msg.forUser === trimmed
      );
      setMessages(userMsgs);
      setUsername(trimmed);
      setWaitingForName(false);
      localStorage.setItem("username", trimmed);
      localStorage.setItem("chatMessages", JSON.stringify(userMsgs));
    }
    // else: do nothing
  }, [selectedUser, allUsers, chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateUsersList = (history) => {
    const names = history.filter(msg => msg.sender !== "bot").map(msg => msg.sender);
    setAllUsers(Array.from(new Set(names)));
  };

  const handleSend = () => {
    if (!input.trim()) return;

    if (waitingForName) {
      const name = input.trim();
      const isExistingUser = allUsers.includes(name);

      setUsername(name);
      localStorage.setItem("username", name);
      setWaitingForName(false);

      let userMessages = [];
      let updatedHistory = [...chatHistory];

      if (!isExistingUser) {
        const userMessage = { sender: name, text: name, timestamp: new Date().toLocaleTimeString(), reaction: null };
        const botConfirm = { sender: "bot", text: `Your name is ${name}`, timestamp: new Date().toLocaleTimeString(), reaction: null };
        const botWelcome = { sender: "bot", text: `Nice to meet you, ${name}! How can I help you today?`, timestamp: new Date().toLocaleTimeString(), reaction: null };
        userMessages = [userMessage, botConfirm, botWelcome];
        updatedHistory = [...updatedHistory, ...userMessages];
      } else {
        userMessages = updatedHistory.filter(msg => msg.sender === name || msg.forUser === name);
      }

      setMessages(userMessages);
      setChatHistory(updatedHistory);
      localStorage.setItem("chatMessages", JSON.stringify(userMessages));
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      botSound.play();
      setInput("");
      updateUsersList(updatedHistory);
    } else {
      const userMessage = { sender: username, text: input, timestamp: new Date().toLocaleTimeString(), reaction: null };
      const updatedMessages = [...messages, userMessage];
      const updatedHistory = [...chatHistory, userMessage];

      setMessages(updatedMessages);
      setChatHistory(updatedHistory);

      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      setInput("");
      generateResponse(input, updatedMessages, updatedHistory);
    }
  };

  const generateResponse = (text, currentMessages, currentHistory) => {
    setTyping(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      const matched = faqPatterns.find(item => item.patterns.some(pattern => lower.includes(pattern)));
      const botText = matched ? matched.response : fallbackResponse;

      const botMsg = { sender: "bot", text: botText, timestamp: new Date().toLocaleTimeString(), reaction: null };
      const updatedMessages = [...currentMessages, botMsg];
      const updatedHistory = [...currentHistory, botMsg];

      setMessages(updatedMessages);
      setChatHistory(updatedHistory);

      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

      botSound.play();
      setTyping(false);
    }, 1000);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.setItem("chatMessages", JSON.stringify([]));
  };

  const toggleTheme = () => setDarkMode(prev => !prev);

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

    const historyIdx = chatHistory.findIndex(msg =>
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
    <div className="flex max-w-4xl mx-auto p-4">
      {/* Sidebar */}
      <div className="w-1/4 border rounded mr-4 p-2 bg-gray-100 dark:bg-gray-900">
        <input
          type="text"
          className="w-full border px-1 py-0.5 rounded text-xs text-black mb-2"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          placeholder="Type existing user name..."
        />
        {selectedUser.trim() && allUsers.includes(selectedUser.trim()) ? (
          <>
            <h3 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-200">Chat of "{selectedUser.trim()}"</h3>
            {chatHistory
              .filter(msg => msg.sender === selectedUser.trim() || msg.forUser === selectedUser.trim())
              .map((msg, idx) => (
                <div key={idx} className="text-xs mb-1">
                  [{msg.timestamp}] <b>{msg.sender || "bot"}:</b> {msg.text} {msg.reaction && <>{msg.reaction}</>}
                </div>
              ))}
          </>
        ) : (
          <div className="text-xs text-gray-500">Type existing username to see chat</div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        {/* Top controls */}
        <div className="flex justify-between mb-2">
          <button onClick={toggleTheme} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>
          <button onClick={exportHistory} className="text-xs bg-green-500 text-white px-2 py-1 rounded">
            Export History
          </button>
          <button
            onClick={() => {
              setUsername("");
              setWaitingForName(true);
              setMessages([]);
              localStorage.removeItem("username");
              localStorage.setItem("chatMessages", JSON.stringify([]));

              const welcome = {
                sender: "bot",
                text: "Hi! What’s your name?",
                timestamp: new Date().toLocaleTimeString(),
                reaction: null
              };

              const updatedHistory = [...chatHistory, welcome];
              setChatHistory(updatedHistory);
              localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));

              setMessages([welcome]);
              localStorage.setItem("chatMessages", JSON.stringify([welcome]));
            }}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded"
          >
            New User
          </button>
        </div>

        {/* Chat area */}
        <div className="h-80 overflow-y-auto mb-2 border rounded p-2 bg-gray-50 dark:bg-gray-900">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-1 ${msg.sender === "bot" ? "text-left" : "text-right"}`}>
              <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-600 text-sm">
                {msg.text}
              </span>
              <div className="flex items-center text-xs text-gray-500 justify-end space-x-1">
                <span>{msg.timestamp}</span>
                {msg.sender !== "bot" && (
                  <>
                    <button onClick={() => addReaction(idx, "👍")}>👍</button>
                    <button onClick={() => addReaction(idx, "👎")}>👎</button>
                    {msg.reaction && <span>{msg.reaction}</span>}
                  </>
                )}
              </div>
            </div>
          ))}
          {typing && <div className="text-xs text-gray-400 italic animate-pulse">Bot is typing...</div>}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            className="flex-1 border px-2 py-1 rounded text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={waitingForName ? "Type your name..." : "Type a message..."}
          />
          <button onClick={handleSend} className="bg-blue-500 text-white px-3 rounded">Send</button>
          <button onClick={clearChat} className="bg-gray-300 text-black px-2 rounded">Clear</button>
        </div>

        {/* Bottom history */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Full Chat History</h3>
          <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-900">
            {chatHistory.length === 0 ? (
              <div className="text-xs text-gray-500">No chat history yet.</div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className="text-xs mb-1">
                  [{msg.timestamp}] <b>{msg.sender || "bot"}:</b> {msg.text} {msg.reaction && <>{msg.reaction}</>}
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
