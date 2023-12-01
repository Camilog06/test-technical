import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const [nickname, setNickname] = useState('');
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setNickname(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:1234/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname, state: 'active' }),
    });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.existingUser) {
          await fetch(`http://localhost:1234/users/${nickname}/state`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ state: 'active' }),
          });
        }

        setRegistered(true);
        navigate('/home', {state: {nickname}});
      } else {
        console.error('Error al registrar:', response.statusText);
      }
    } catch (error) {
      console.error('Error de red:', error.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {registered && <p>¡Registro exitoso! Puedes hacer algo aquí.</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Nickname:
          <input
            type="text"
            name="nickname"
            value={nickname}
            onChange={handleChange}
          />
        </label>
        <br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterForm;