import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './home';
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
