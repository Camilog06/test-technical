import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import moment from 'moment';
import './App.css';

const ChatView = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [giphyResults, setgiphyResults] = useState([]);
  

  useEffect(() => {
    const newSocket = io('http://localhost:1234');
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log('Conectado al servidor');
    });
  
    newSocket.on('newMessage', (msg) => {
      console.log('Nuevo mensaje del servidor:', msg);
      setMessages((prevMessages) => [...prevMessages, msg]);
    }); 
    
    newSocket.on('previousMessages', (prevMessages) => {
      setMessages(prevMessages); 
    });


    newSocket.on('youtubeResults', (results) => {
      console.log('Resultados de YouTube recibidos:', results);
      setYoutubeResults(results);
    });

    try {

    newSocket.on('giphyResults', (results) => {
      console.log('Resultados de Giphy recibidos:', results);
      if (results.gifUrl) {
        setgiphyResults([{ gifUrl: results.gifUrl }]);
      }
    });

  } catch (error) {
    console.error('Error searching Giphy:', error);
}
        
    newSocket.emit('previousMessages');

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (message.startsWith('/youtube')) {
      const keyword = message.replace('/youtube', '').trim();
      handleSearchYouTube(keyword);
    } else {

      if (message.startsWith('/giphy')) {
        const keyword = message.replace('/giphy', '').trim();
        handleSearchGiphy(keyword);
      } 
      else {

      if (!nickname) {
        alert('Ingresa el nickname');
        return;
      }
  
      if (!message) {
        alert('El mensaje no puede estar vacío');
        return;
      }
  
      if (socket) {
        const timestamp = moment().format();
  
        socket.emit('message', {
          nickname,
          message,
          timestamp,
        });

        setMessages([...messages, { nickname, message, timestamp }]);
        setMessage('');
      }
    }
    }
  };
  

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSearchYouTube = (keyword) => {
    if (socket) {
      console.log('Searching YouTube for:', keyword);
      socket.emit('searchYouTube', keyword);
    }
  };

  const handleSearchGiphy = async (keyword) => {
    if (socket) {
      console.log('Searching Giphy for:', keyword);
      try {
        const response = await fetch(`http://localhost:1234/giphy?keywordg=${encodeURIComponent(keyword)}`);
        const results = await response.json();
      
        if (results && results.error) {
          console.error('Error searching Giphy:', results.error);
        } else if (results && Array.isArray(results) && results.length > 0 && results[0].gifUrl) {
          setgiphyResults(results);
        } else {
          console.error('No gifUrl found in Giphy results.');
        }
      } catch (error) {
        console.error('Error searching Giphy:', error);
      }      
    }
  };  
    

  return (
    <div>
      <div>
        <label>Nickname:</label>
        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>
      <div>
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.nickname}:</strong> {msg.message} ({msg.timestamp})
              </li>
            ))}
          </ul>
      </div>
      <div>
        
        <ul>
          {youtubeResults.map((result, index) => (
            <li key={index}>
              <h3>Resultados de YouTube:</h3>
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${result.videoId}`}
                title={result.title}
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <p>Título: {result.title}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <ul>
          {giphyResults.map((result, index) => (
            <li key={index}>
              <h3>Resultados de Giphy:</h3>
              {result.gifUrl && <img src={result.gifUrl} alt="Giphy" />}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label>Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
    
  );
};

export default ChatView;
