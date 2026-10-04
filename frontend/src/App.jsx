import { useState } from 'react';
import BusinessDashboard from './pages/BusinessDashboard';
import InvestorDashboard from './pages/InvestorDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('business');

  return (
    <div className="container">
      <h1>Invoice liquidity</h1>

      <nav className="tabs">
        <button
          className={activeTab === 'business' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('business')}
        >
          Business
        </button>
        <button
          className={activeTab === 'investor' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('investor')}
        >
          Investor
        </button>
      </nav>

      {activeTab === 'business' && <BusinessDashboard />}
      {activeTab === 'investor' && <InvestorDashboard />}
    </div>
  );
}

export default App;