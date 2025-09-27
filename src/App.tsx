import React from 'react';
import './App.css';
import LocationPicker from './LocationPicker';


function App() {
  return (
    <div className="App">
      <header className="rb-header">
        <div className="rb-container rb-header-inner">
          <div className="rb-brand">
            <span className="dot" />
            <span>red-bus</span>
          </div>
          <div className="rb-muted" style={{fontSize: 14}}>India's No.1 Online Bus Ticketing Platform</div>
        </div>
      </header>
      <main className="rb-container" style={{ paddingTop: 24 }}>
        <h2 style={{ margin: '12px 0 14px', fontSize: 28, fontWeight: 700, color: 'var(--rb-navy)' }}>
          Search Buses
        </h2>
        <LocationPicker />
      </main>
    </div>
  );
}

export default App;
