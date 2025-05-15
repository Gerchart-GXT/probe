// src/components/subscription/SubscriptionManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserSubscriptions, getAllServers } from '../../api';
import { LoadingSpinner, ErrorMessage } from '../common';
import EditSubscription from './EditSubscription';
import AddSubscription from './AddSubscription';
import './SubscriptionManager.css';

const SubscriptionManager = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // 获取用户的订阅
        const subsResponse = await getUserSubscriptions(user.id, user.token);
        
        if (subsResponse && subsResponse.status) {
          setSubscriptions(subsResponse.servers || []);
        }
        
        // 获取所有服务器
        const serversResponse = await getAllServers(user.token);
        
        if (serversResponse && serversResponse.status) {
          setServers(serversResponse.data || []);
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('无法获取订阅数据，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAddClick = () => {
    setShowAddForm(true);
    setEditingSubscription(null);
  };

  const handleEditClick = (subscription) => {
    setEditingSubscription(subscription);
    setShowAddForm(false);
  };

  const handleSubscriptionUpdated = async () => {
    // 刷新订阅列表
    try {
      const response = await getUserSubscriptions(user.id, user.token);
      
      if (response && response.status) {
        setSubscriptions(response.servers || []);
      }
      
      setEditingSubscription(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error refreshing subscriptions:', err);
      setError('刷新订阅列表失败');
    }
  };

  const handleCancel = () => {
    setEditingSubscription(null);
    setShowAddForm(false);
  };

  // 根据订阅获取服务器详情
  const getServerBySubscription = (subscription) => {
    return servers.find(server => server.id === subscription.server_id) || null;
  };

  if (isLoading) {
    return <LoadingSpinner text="加载订阅数据..." />;
  }

  // 获取已订阅的服务器ID列表
  const subscribedServerIds = subscriptions.map(sub => sub.server_id);
  
  // 过滤出未订阅的服务器
  const availableServers = servers.filter(server => !subscribedServerIds.includes(server.id));

  return (
    <div className="subscription-manager">
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      {!showAddForm && !editingSubscription && (
        <>
          <div className="subscription-manager-header">
            <h2>管理服务器订阅</h2>
            <button 
              className="add-button"
              onClick={handleAddClick}
              disabled={availableServers.length === 0}
            >
              添加新订阅
            </button>
          </div>
          
          {subscriptions.length === 0 ? (
            <div className="no-subscriptions">
              <p>您尚未订阅任何服务器</p>
              {availableServers.length > 0 && (
                <button 
                  className="add-button"
                  onClick={handleAddClick}
                >
                  添加服务器订阅
                </button>
              )}
            </div>
          ) : (
            <div className="subscriptions-list">
              {subscriptions.map(subscription => {
                const server = getServerBySubscription(subscription);
                return (
                  <div key={subscription.id} className="subscription-item">
                    <div className="subscription-info">
                      <h3>{server ? server.name : '未知服务器'}</h3>
                      <p>
                        <span className="info-label">IP地址:</span>
                        <span className="info-value">{server ? server.ip : 'N/A'}</span>
                      </p>
                      <p>
                        <span className="info-label">状态:</span>
                        <span className={`status-badge ${server ? server.status : 'unknown'}`}>
                          {server ? (server.status === 'online' ? '在线' : '离线') : '未知'}
                        </span>
                      </p>
                      <p>
                        <span className="info-label">标签:</span>
                        <span className="info-value">
                          {subscription.tags && subscription.tags.length 
                            ? subscription.tags.join(', ') 
                            : '无标签'}
                        </span>
                      </p>
                      <p>
                        <span className="info-label">备注:</span>
                        <span className="info-value">{subscription.notes || '无备注'}</span>
                      </p>
                    </div>
                    <div className="subscription-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(subscription)}
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {showAddForm && (
        <AddSubscription 
          availableServers={availableServers}
          onSubscriptionAdded={handleSubscriptionUpdated}
          onCancel={handleCancel}
        />
      )}
      
      {editingSubscription && (
        <EditSubscription 
          subscription={editingSubscription}
          server={getServerBySubscription(editingSubscription)}
          onSubscriptionUpdated={handleSubscriptionUpdated}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;