import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const handleVoiceInput = () => {
    if (isListening) return;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);

      setTimeout(() => {
        handleSend(transcript);
      }, 500);

      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (inputMessage) => {
    const finalMessage = inputMessage || message;
    if (!finalMessage.trim()) return;

    const userMessage = { sender: 'user', text: finalMessage };
    setChat((prevChat) => [...prevChat, userMessage]);
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: finalMessage }),
    });

      const data = await response.json();
      const botMessage = { sender: 'bot', text: data.reply };

      setChat((prevChat) => [...prevChat, botMessage]);
      speakText(data.reply);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="container">
      <h1>🎤 Voice Chatbot</h1>

      {isListening && <div className="listening">🎤 Listening...</div>}

      <div className="chat-box">
        {chat.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div className="message bot">Typing...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={() => handleSend()}>Send</button>
        <button onClick={handleVoiceInput}>🎤 Speak</button>
      </div>
    </div>
  );
}

export default App;