// src/context/AppDataContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getConversations, getAgents, getKnowledgeBases, getTemplates } from '../api';
import { useWebSocket } from './WebSocketContext';

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [agents, setAgents] = useState([]);
    const [knowledgeBases, setKnowledgeBases] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [metrics, setMetrics] = useState({
        csat: 0,
        avgResponseTime: 0,
        activeConversations: 0,
        escalationRate: 0
    });
    const [loading, setLoading] = useState({
        conversations: true,
        agents: true,
        knowledgeBases: true,
        templates: true,
    });
    const [error, setError] = useState({
        conversations: null,
        agents: null,
        knowledgeBases: null,
        templates: null,
    });

    const { lastMessage } = useWebSocket();

    // Load initial data
    useEffect(() => {
        const loadData = async() => {
            // Load conversations
            try {
                const conversationsData = await getConversations();
                setConversations(conversationsData.data || []);
                setLoading(prev => ({...prev, conversations: false }));
            } catch (err) {
                console.error('Error loading conversations:', err);
                setError(prev => ({...prev, conversations: err.message }));
                setLoading(prev => ({...prev, conversations: false }));
            }

            // Load agents
            try {
                const agentsData = await getAgents();
                setAgents(agentsData || []);
                setLoading(prev => ({...prev, agents: false }));
            } catch (err) {
                console.error('Error loading agents:', err);
                setError(prev => ({...prev, agents: err.message }));
                setLoading(prev => ({...prev, agents: false }));
            }

            // Load knowledge bases
            try {
                const knowledgeBasesData = await getKnowledgeBases();
                setKnowledgeBases(knowledgeBasesData || []);
                setLoading(prev => ({...prev, knowledgeBases: false }));
            } catch (err) {
                console.error('Error loading knowledge bases:', err);
                setError(prev => ({...prev, knowledgeBases: err.message }));
                setLoading(prev => ({...prev, knowledgeBases: false }));
            }

            // Load templates
            try {
                const templatesData = await getTemplates();
                setTemplates(templatesData || []);
                setLoading(prev => ({...prev, templates: false }));
            } catch (err) {
                console.error('Error loading templates:', err);
                setError(prev => ({...prev, templates: err.message }));
                setLoading(prev => ({...prev, templates: false }));
            }
        };

        loadData();
    }, []);

    // Handle WebSocket updates
    useEffect(() => {
        if (!lastMessage) return;

        try {
            switch (lastMessage.type) {
                case 'conversations_update':
                    setConversations(lastMessage.data);
                    break;

                case 'new_conversation':
                    setConversations(prev => [...prev, lastMessage.data]);
                    break;

                case 'message_update':
                    setConversations(prev =>
                        prev.map(conv =>
                            conv.id === lastMessage.conversationId ? {
                                ...conv,
                                hasNewMessage: true,
                                lastMessage: lastMessage.message,
                                messages: [...(conv.messages || []), lastMessage.message]
                            } :
                            conv
                        )
                    );
                    break;

                case 'metrics_update':
                    setMetrics(lastMessage.metrics);
                    break;

                case 'agent_update':
                    setAgents(prev =>
                        prev.map(agent =>
                            agent.id === lastMessage.agentId ? {...agent, ...lastMessage.data } :
                            agent
                        )
                    );
                    break;

                case 'template_update':
                    setTemplates(lastMessage.data);
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }, [lastMessage]);

    const updateConversation = (id, data) => {
        setConversations(prev =>
            prev.map(conv => (conv.id === id ? {...conv, ...data } : conv))
        );
    };

    const updateAgent = (id, data) => {
        setAgents(prev =>
            prev.map(agent => (agent.id === id ? {...agent, ...data } : agent))
        );
    };

    const addTemplate = (template) => {
        setTemplates(prev => [...prev, template]);
    };

    const updateTemplate = (id, data) => {
        setTemplates(prev =>
            prev.map(template => (template.id === id ? {...template, ...data } : template))
        );
    };

    const deleteTemplate = (id) => {
        setTemplates(prev => prev.filter(template => template.id !== id));
    };

    const contextValue = {
        conversations,
        agents,
        knowledgeBases,
        templates,
        metrics,
        loading,
        error,
        updateConversation,
        updateAgent,
        addTemplate,
        updateTemplate,
        deleteTemplate,
    };

    return React.createElement(
        AppDataContext.Provider, { value: contextValue },
        children
    );
};