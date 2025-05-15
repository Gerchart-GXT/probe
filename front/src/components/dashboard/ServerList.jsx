// src/components/dashboard/ServerList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserSubscriptions, getAllServers } from '../../api';
import { LoadingSpinner, ErrorMessage, Modal } from '../common';
import { AddSubscription, EditSubscription, ManageSubscriptions } from '../subscription';
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
  const [availableServers, setAvailableServers] = useState([]);
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);

  // 获取用户的订阅和可用服务器
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

  useEffect(() => {
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
    }
  }, [servers, subscriptions]);

  const handleManageSubscriptions = () => {
    setShowManageModal(true);
  };

  const handleCloseManageModal = () => {
    setShowManageModal(false);
    setIsAddingSubscription(false);
    setEditingSubscription(null);
  };

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
    setIsAddingSubscription(false);
    setShowManageModal(true);
  };

  const handleAddSubscription = () => {
    setIsAddingSubscription(true);
    setEditingSubscription(null);
    setShowManageModal(true);
  };

  const handleSubscriptionUpdated = () => {
    fetchData();
    handleCloseManageModal();
  };

  // 根据订阅ID获取服务器详情
  const getServerBySubscription = (subscription) => {
    return servers.find(server => server.id === subscription.server_id) || null;
  };

  // 管理订阅模态框内容
  const renderManageModalContent = () => {
    if (isAddingSubscription) {
      return (
        <AddSubscription 
          availableServers={availableServers}
          onSubscriptionAdded={handleSubscriptionUpdated}
          onCancel={handleCloseManageModal}
        />
      );
    }
    
    if (editingSubscription) {
      const server = getServerBySubscription(editingSubscription);
      return (
        <EditSubscription
          subscription={editingSubscription}
          server={server}
          onSubscriptionUpdated={handleSubscriptionUpdated}
          onCancel={handleCloseManageModal}
        />
      );
    }
    
    return (
      <ManageSubscriptions
        subscriptions={subscriptions}
        getServerBySubscription={getServerBySubscription}
        onEditSubscription={handleEditSubscription}
        onAddSubscription={handleAddSubscription}
        availableServers={availableServers}
      />
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