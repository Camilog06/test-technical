import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RegisterForm from './register';
import Home from './home';
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<RegisterForm />} />
    </Routes>
  );
}

export default App;
