import React from 'react';

/**
 * DashboardStats - Shows key statistics cards at the top of the dashboard.
 *
 * Props:
 *   totalRooms    - total active rooms available
 *   myRooms       - rooms the user has joined
 *   createdRooms  - rooms the user created
 */
export default function DashboardStats({ totalRooms = 0, myRooms = 0, createdRooms = 0 }) {
  const stats = [
    {
      label: 'Active Rooms',
      value: totalRooms,
      icon: '🏫',
      gradient: 'stat-card-gradient-blue',
      description: 'Currently live study rooms',
    },
    {
      label: 'My Rooms',
      value: myRooms,
      icon: '📚',
      gradient: 'stat-card-gradient-purple',
      description: 'Rooms you have joined',
    },
    {
      label: 'Created',
      value: createdRooms,
      icon: '✏️',
      gradient: 'stat-card-gradient-teal',
      description: 'Rooms you have created',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card ${stat.gradient}`}>
          <div className="stat-card-icon">{stat.icon}</div>
          <div className="stat-card-info">
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
            <div className="stat-card-desc">{stat.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
