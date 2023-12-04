import React, { useState, useEffect } from 'react';
import './App.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

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
  }, [location.state]);

  useEffect(() => {
    const socket = io('http://localhost:1234');

    socket.on('message', (receivedMessage) => {
      console.log('Mensaje recibido en el cliente:', receivedMessage);

      if (receivedMessage.timestamp) {
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      } else {
        console.warn('Mensaje recibido sin marca de tiempo válida:', receivedMessage);
      }
    });

    socket.on('commandReceived', (commandInfo) => {
      if (commandInfo.systemMessage && commandInfo.message) {
        setMessages((prevMessages) => [...prevMessages, commandInfo.message]);
      }
    });

    socket.on('previousMessages', (previousMessages) => {
      setMessages(previousMessages);
    });

    socket.emit('getPreviousMessages');

    return () => {
      socket.disconnect();
    };
  }, []);

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

      if (messageWithTimestamp.nickname !== nickname) {
        setMessages((prevMessages) => [...prevMessages, messageWithTimestamp]);
      }
      
      setNewMessage('');
    }
  };

  const sendMessageToServer = async (message) => {
    try {
      await fetch('http://localhost:1234/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error al enviar mensaje al servidor:', error.message);
    }
  };

  return (
    <>
      <section id="chat">
        <p>Hola {nickname}</p>
        <ul id="messages">
          {messages.map((msg, index) => (
            <li key={index} className={msg.systemMessage ? 'system-message' : ''}>
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


