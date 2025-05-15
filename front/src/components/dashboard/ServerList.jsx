// src/components/dashboard/ServerList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserSubscriptions, updateSubscription, unsubscribeFromServer, getAllServers, subscribeToServer } from '../../api';
import { LoadingSpinner, ErrorMessage, Modal } from '../common';
import ServerCard from './ServerCard';
import './ServerList.css';

const ServerList = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [availableServers, setAvailableServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);

  // 获取用户的订阅和可用服务器
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
        console.error('Error fetching subscriptions:', err);
        setError('无法获取订阅数据，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // 设置定时刷新
    const intervalId = setInterval(() => fetchData(), 300000); // 每5分钟刷新一次
    
    return () => clearInterval(intervalId);
  }, [user]);

  // 计算可用的服务器（未订阅的）
  useEffect(() => {
    if (servers.length > 0 && subscriptions.length >= 0) {
      const subscribedServerIds = subscriptions.map(sub => sub.server_id);
      const available = servers.filter(server => !subscribedServerIds.includes(server.id));
      setAvailableServers(available);
      
      // 默认选择第一个可用服务器
      if (available.length > 0) {
        setSelectedServerId(available[0].id.toString());
      }
    }
  }, [servers, subscriptions]);

  const handleManageSubscriptions = () => {
    setShowManageModal(true);
  };

  const handleCloseManageModal = () => {
    setShowManageModal(false);
    setIsAddingSubscription(false);
    setEditingSubscription(null);
    setEditTags('');
    setEditNotes('');
  };

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
    setEditTags(subscription.tags ? subscription.tags.join(', ') : '');
    setEditNotes(subscription.notes || '');
    setShowManageModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!editingSubscription) return;
    
    try {
      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const response = await updateSubscription(
        editingSubscription.id,
        tags,
        editNotes,
        user.token
      );
      
      if (response && response.status) {
        // 更新本地订阅列表
        setSubscriptions(prevSubs => 
          prevSubs.map(sub => 
            sub.id === editingSubscription.id 
              ? { ...sub, tags, notes: editNotes } 
              : sub
          )
        );
        
        handleCloseManageModal();
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('更新订阅信息失败，请稍后再试');
    }
  };

  const handleUnsubscribe = async (subscriptionId) => {
    if (!window.confirm('确定要取消订阅此服务器吗？')) return;
    
    try {
      const response = await unsubscribeFromServer(subscriptionId, user.token);
      
      if (response && response.status) {
        // 从本地订阅列表中移除
        setSubscriptions(prevSubs => 
          prevSubs.filter(sub => sub.id !== subscriptionId)
        );
        
        // 重新计算可用服务器
        const subscribedServerIds = subscriptions
          .filter(sub => sub.id !== subscriptionId)
          .map(sub => sub.server_id);
        
        const available = servers.filter(server => !subscribedServerIds.includes(server.id));
        setAvailableServers(available);
      }
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError('取消订阅失败，请稍后再试');
    }
  };

  const handleAddSubscription = () => {
    setIsAddingSubscription(true);
    setEditTags('');
    setEditNotes('');
    setShowManageModal(true);
  };

  const handleCreateSubscription = async () => {
    if (!selectedServerId) {
      setError('请选择一个服务器');
      return;
    }
    
    try {
      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const response = await subscribeToServer(
        user.id,
        parseInt(selectedServerId),
        tags,
        editNotes,
        user.token
      );
      
      if (response && response.status) {
        // 重新获取订阅列表
        const subsResponse = await getUserSubscriptions(user.id, user.token);
        
        if (subsResponse && subsResponse.status) {
          setSubscriptions(subsResponse.servers || []);
        }
        
        handleCloseManageModal();
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError('添加订阅失败，请稍后再试');
    }
  };

  // 根据订阅ID获取服务器详情
  const getServerBySubscription = (subscription) => {
    return servers.find(server => server.id === subscription.server_id) || null;
  };

  // 管理订阅模态框内容
  const renderManageModalContent = () => {
    if (isAddingSubscription) {
      return (
        <div className="subscription-form">
          <div className="form-group">
            <label htmlFor="server-select">选择服务器</label>
            <select
              id="server-select"
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
            >
              <option value="">-- 选择服务器 --</option>
              {availableServers.map(server => (
                <option key={server.id} value={server.id}>{server.name} ({server.ip})</option>
              ))}
            </select>
            {availableServers.length === 0 && (
              <p className="no-servers-message">没有可用的服务器</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="tags-input">标签（用逗号分隔）</label>
            <input
              id="tags-input"
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="例如: 生产, 重要, 数据库"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes-input">备注</label>
            <textarea
              id="notes-input"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="添加关于此服务器的备注"
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button 
              className="button secondary" 
              onClick={handleCloseManageModal}
            >
              取消
            </button>
            <button 
              className="button primary" 
              onClick={handleCreateSubscription}
              disabled={!selectedServerId}
            >
              添加订阅
            </button>
          </div>
        </div>
      );
    }
    
    if (editingSubscription) {
      const server = getServerBySubscription(editingSubscription);
      
      return (
        <div className="subscription-form">
          <div className="server-info-summary">
            <h3>{server ? server.name : '未知服务器'}</h3>
            <p>IP: {server ? server.ip : 'N/A'}</p>
          </div>
          
          <div className="form-group">
             <label htmlFor="tags-input">标签（用逗号分隔）</label>
            <input
              id="tags-input"
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="例如: 生产, 重要, 数据库"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes-input">备注</label>
            <textarea
              id="notes-input"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="添加关于此服务器的备注"
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button 
              className="button danger" 
              onClick={() => handleUnsubscribe(editingSubscription.id)}
            >
              取消订阅
            </button>
            <button 
              className="button secondary" 
              onClick={handleCloseManageModal}
            >
              取消
            </button>
            <button 
              className="button primary" 
              onClick={handleSaveSubscription}
            >
              保存更改
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="manage-subscriptions">
        <h3>管理订阅</h3>
        <button 
          className="add-subscription-button" 
          onClick={handleAddSubscription}
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
                      onClick={() => handleEditSubscription(subscription)}
                    >
                      编辑
                    </button>
                    <button 
                      className="remove-subscription-button" 
                      onClick={() => handleUnsubscribe(subscription.id)}
                    >
                      删除
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

  if (isLoading && subscriptions.length === 0) {
    return <LoadingSpinner text="加载服务器数据..." />;
  }

  return (
    <div className="server-list-container">
      <div className="server-list-header">
        <h2 className="server-list-title">已订阅服务器</h2>
        <button 
          className="manage-button"
          onClick={handleManageSubscriptions}
        >
          管理订阅
        </button>
      </div>
      
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')} 
        />
      )}
      
      {subscriptions.length === 0 ? (
        <div className="no-subscriptions-container">
          <p className="no-subscriptions-message">
            您尚未订阅任何服务器。点击"管理订阅"按钮添加服务器。
          </p>
          <button 
            className="add-server-button"
            onClick={handleAddSubscription}
          >
            添加服务器
          </button>
        </div>
      ) : (
        <div className="server-grid">
          {subscriptions.map(subscription => {
            const server = getServerBySubscription(subscription);
            return server ? (
              <ServerCard 
                key={subscription.id}
                server={server}
                subscription={subscription}
                onEdit={handleEditSubscription}
                token={user.token}
              />
            ) : null;
          })}
        </div>
      )}
      
      <Modal
        isOpen={showManageModal}
        onClose={handleCloseManageModal}
        title={isAddingSubscription ? "添加新服务器订阅" : editingSubscription ? "编辑服务器订阅" : "管理服务器订阅"}
        size="medium"
      >
        {renderManageModalContent()}
      </Modal>
    </div>
  );
};

export default ServerList;