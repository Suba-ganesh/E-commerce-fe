import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatDate, formatCurrency } from '../utils/helpers';
import './Dashboard.css';

interface StatItem {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

export const Dashboard: React.FC = () => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');

  const stats: StatItem[] = [
    { label: 'Active Users', value: '1,284', change: '+12%', isPositive: true },
    { label: 'Total Revenue', value: formatCurrency(14350), change: '+8%', isPositive: true },
    { label: 'Pending Request', value: 3, change: '-15%', isPositive: false },
  ];

  const handleTestConnection = async () => {
    setLoadingAction(true);
    setDbStatus('checking');
    
    // Simulate connection check to the Chennis backend
    setTimeout(() => {
      setLoadingAction(false);
      setDbStatus('connected');
    }, 1500);
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Chennis Dashboard</h1>
          <p className="subtitle">Welcome to the Chennis administrative panel. Current date: {formatDate(new Date())}</p>
        </div>
        <div className="connection-badge-wrapper">
          <span className={`status-dot dot-${dbStatus}`}></span>
          <span className="status-text">
            Backend Status: <strong>{dbStatus === 'connected' ? 'Connected' : dbStatus === 'checking' ? 'Connecting...' : 'Offline'}</strong>
          </span>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <Card key={i} hoverEffect borderGlow className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <div className="stat-value-row">
              <span className="stat-value">{stat.value}</span>
              <span className={`stat-change ${stat.isPositive ? 'change-positive' : 'change-negative'}`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <Card glass className="main-info-card">
          <h2>Backend API Integration</h2>
          <p className="card-description">
            This React app is pre-configured with a fetch service (`src/services/api.ts`) to request data from the Chennis Backend. 
            All modular folders are initialized. Start mapping endpoints, configuring auth state, and designing views.
          </p>
          
          <div className="actions-row">
            <Button 
              variant="primary" 
              isLoading={loadingAction}
              onClick={handleTestConnection}
            >
              Test Backend Connection
            </Button>
            <Button variant="secondary" onClick={() => window.open('https://github.com', '_blank')}>
              View Docs
            </Button>
          </div>
        </Card>

        <Card className="structure-card">
          <h3>Folder Structure Info</h3>
          <ul className="structure-list">
            <li>
              <code>src/components/</code>: Global reusable elements (e.g. <code>Button.tsx</code>, <code>Card.tsx</code>).
            </li>
            <li>
              <code>src/pages/</code>: Complete page layouts.
            </li>
            <li>
              <code>src/services/api.ts</code>: Complete, token-aware API fetch instance.
            </li>
            <li>
              <code>src/context/AuthContext.tsx</code>: Integrated local storage user auth manager.
            </li>
            <li>
              <code>src/hooks/useFetch.ts</code>: Custom hook mapping loading state for endpoints.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
