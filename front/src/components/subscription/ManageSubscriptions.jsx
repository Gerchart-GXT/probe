// src/components/subscription/ManageSubscriptions.jsx
import React from 'react';
import './ManageSubscriptions.css';

const ManageSubscriptions = ({ 
  subscriptions, 
  getServerBySubscription, 
  onEditSubscription, 
  onAddSubscription,
  availableServers 
}) => {
  return (
    <div className="manage-subscriptions">
      <h3>管理订阅</h3>
      <button
        className="add-subscription-button"
        onClick={onAddSubscription}
        disabled={availableServers.length === 0}
      >
        添加新订阅
      </button>
      <div className="subscription-list">
        {subscriptions.length === 0 ? (
          <p className="no-subscriptions">您尚未订阅任何服务器</p>
        ) : (
          subscriptions.map(subscription => {
            const server = getServerBySubscription(subscription);
            return (
              <div key={subscription.id} className="subscription-item">
                <div className="subscription-info">
                  <h4>{server ? server.name : '未知服务器'}</h4>
                  <p>IP: {server ? server.ip : 'N/A'}</p>
                  <p>标签: {subscription.tags && subscription.tags.length > 0
                    ? subscription.tags.join(', ')
                    : '无'}</p>
                </div>
                <div className="subscription-actions">
                  <button
                    className="edit-subscription-button"
                    onClick={() => onEditSubscription(subscription)}
                  >
                    编辑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageSubscriptions;