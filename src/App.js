   // src/App.js
   import React from 'react';
   import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
   import Home from './pages/Home';
    import Transfer from './pages/Transfer';
   import './App.css';

   function App() {
     return (
       <Router>
         <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/transfer" element={<Transfer />} />
         </Routes>
       </Router>
     );
   }

   export default App;