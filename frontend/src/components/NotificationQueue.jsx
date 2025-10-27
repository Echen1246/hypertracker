import { useState, useEffect } from 'react';
import './NotificationQueue.css';

const NotificationQueue = ({ notifications, onDismiss }) => {
  return (
    <div className="notification-queue">
      <div className="notification-header">
        <span className="notification-title">Trades</span>
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No recent trades</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="notification-item">
              <div className="notification-item-header">
                <span className="notification-wallet">{notif.wallet}</span>
                <button 
                  className="notification-dismiss"
                  onClick={() => onDismiss(notif.id)}
                >
                  ×
                </button>
              </div>
              
              <div className="notification-details">
                <span className={`notification-action ${notif.action}`}>
                  {notif.action.toUpperCase()}
                </span>
                <span className="notification-coin">{notif.coin}</span>
                {notif.direction && (
                  <span className={`notification-direction ${notif.direction.toLowerCase()}`}>
                    {notif.direction}
                  </span>
                )}
              </div>
              
              {notif.details && (
                <div className="notification-info">
                  {notif.details}
                </div>
              )}
              
              <div className="notification-time">
                {notif.timestamp}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationQueue;

