import { useState } from 'react';
import BusinessDashboard from './pages/BusinessDashboard';
import InvestorDashboard from './pages/InvestorDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('business');

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('business')}>
          Business
        </button>
        <button onClick={() => setActiveTab('investor')}>
          Investor
        </button>
      </nav>

      <hr />

      {activeTab === 'business' && <BusinessDashboard />}
      {activeTab === 'investor' && <InvestorDashboard />}
    </div>
  );
}

export default App;