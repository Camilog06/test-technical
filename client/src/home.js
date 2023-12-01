import React, { useState, useEffect } from 'react';
import './App.css'
import { useLocation, useNavigate } from 'react-router-dom';

function LogoutButton() {
  const [nickname, setNickname] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();

  const location = useLocation();
  useEffect(() => {
    if (location.state && location.state.nickname) {
      setNickname(location.state.nickname);
    }
  }, [location.state] );

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const response = await fetch('http://localhost:1234/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetch(`http://localhost:1234/users/${nickname}/state`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: 'inactive' }),
        });
        navigate('/');
      } else {
        console.error('Error al cerrar sesión:', response.statusText);
      }
    } catch (error) {
      console.error('Error de red:', error.message);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
  
    if (newMessage.trim() === '') {
      return;
    }
  
    const messageWithTimestamp = {
      nickname,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };
  
    if (newMessage.startsWith('/')) {
      const [command, ...args] = newMessage.slice(1).split(' ');
  
      try {
        const response = await fetch('http://localhost:1234/users/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nickname, command, args }),
        });
  
        if (!response.ok) {
          console.error('Error al enviar el comando al servidor:', response.statusText);
        }
      } catch (error) {
        console.error('Error de red al enviar el comando al servidor:', error.message);
      }
    } else {
      sendMessageToServer(messageWithTimestamp);
  
      setMessages((prevMessages) => [...prevMessages, messageWithTimestamp]);
      setNewMessage('');
    }
  };
    

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:1234'); 

    ws.onmessage = (event) => {
      const receivedMessage = JSON.parse(event.data);
      console.log('Mensaje recibido en el cliente:', receivedMessage);
    
      if (receivedMessage.message.timestamp) {
        setMessages((prevMessages) => [...prevMessages, receivedMessage.message]);
      } else {
        console.warn('Mensaje recibido sin marca de tiempo válida:', receivedMessage);
      }
    };

    
    return () => {
      ws.close();
    };
  };

 
  useEffect(() => {
    const cleanupWebSocket = setupWebSocket();

    
    return cleanupWebSocket;
  }, []); 

  
  const sendMessageToServer = (message) => {
   
    console.log('Enviando mensaje al servidor:', message);
    console.log(nickname)
  };

  return (
    <>
      <section id="chat">
      <p>Hola {nickname}</p>
  <ul id="messages">
    {messages.map((msg, index) => (
      <li key={index}>
        <strong>{msg.nickname}:</strong> {msg.message} - {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Invalid Date'}
      </li>
    ))}
  </ul>
  <form id="form" onSubmit={handleSendMessage}>
    <input
      type="text"
      name="message"
      id="input"
      placeholder="Type a message"
      autoComplete="off"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
    />
    <button type="submit">Enviar</button>
  </form>
</section>

      <button onClick={handleLogout} disabled={loggingOut}>
        Cerrar Sesión
      </button>
    </>
  );
}

export default LogoutButton;
