// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
  SimpleGrid,
  Button,
  Badge,
  Spinner,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiMessageCircle, FiUsers, FiClock, FiThumbsUp, FiAlertCircle } from 'react-icons/fi';
import { useAppData } from '../context/AppDataContext';
import { subscribeToMetrics } from '../api';
import ConversationList from '../components/ConversationList';
import MetricsCard from '../components/MetricsCard';

const Dashboard = () => {
  const { conversations, agents, metrics, loading, error } = useAppData();
  const [timeRange, setTimeRange] = useState('today');
  const [liveMetrics, setLiveMetrics] = useState(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Responsive columns
  const columns = useBreakpointValue({ base: 1, sm: 2, md: 2, lg: 4 });
  const tabOrientation = useBreakpointValue({ base: 'horizontal', md: 'horizontal' });

  // Subscribe to SSE metrics updates
  useEffect(() => {
    const eventSource = subscribeToMetrics(
      (data) => {
        setLiveMetrics(data);
      },
      (error) => {
        console.error('Metrics SSE error:', error);
      }
    );

    return () => {
      eventSource.close();
    };
  }, []);

  // Use live metrics if available, otherwise use context metrics
  const displayMetrics = liveMetrics || metrics;

  // Calculate metrics
  const activeConversations = conversations.filter(conv => conv.status === 'active').length;
  const escalatedConversations = conversations.filter(conv => conv.status === 'escalated').length;
  const highAlertConversations = conversations.filter(conv => conv.alertLevel === 'high').length;
  
  const avgSentiment = conversations.length > 0
    ? conversations.reduce((sum, conv) => sum + (conv.metrics?.sentiment || 0), 0) / conversations.length
    : 0;
  
  const sentimentPercentage = `${Math.round(avgSentiment * 100)}%`;

  if (loading.conversations && loading.agents) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 2, md: 4 }}>
      {/* Header - Mobile Responsive */}
      <Flex 
        justify="space-between" 
        align={{ base: 'flex-start', md: 'center' }}
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 4, md: 0 }}
      >
        <Box>
          <Heading size={{ base: 'md', md: 'lg' }}>Agent Supervisor Dashboard</Heading>
          <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
            Monitor and manage AI agent interactions
          </Text>
        </Box>
        
        {/* Time Range Buttons - Mobile Responsive */}
        <Flex gap={2} flexWrap="wrap">
          <Button
            size={{ base: 'xs', md: 'sm' }}
            variant={timeRange === 'today' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('today')}
          >
            Today
          </Button>
          <Button
            size={{ base: 'xs', md: 'sm' }}
            variant={timeRange === 'week' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </Button>
          <Button
            size={{ base: 'xs', md: 'sm' }}
            variant={timeRange === 'month' ? 'solid' : 'outline'}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </Button>
        </Flex>
      </Flex>
      
      {/* Metrics Cards - Mobile Responsive Grid */}
      <SimpleGrid columns={columns} spacing={{ base: 3, md: 4 }} mb={6}>
        <MetricsCard
          title="Active Conversations"
          value={displayMetrics?.activeConversations || activeConversations}
          icon={FiMessageCircle}
          change="23%"
          changeType="increase"
          color="blue"
        />
        <MetricsCard
          title="Escalations"
          value={displayMetrics?.escalationRate ? `${Math.round(displayMetrics.escalationRate * 100)}%` : escalatedConversations}
          icon={FiAlertCircle}
          change="5%"
          changeType="decrease"
          color="orange"
        />
        <MetricsCard
          title="Avg Response Time"
          value={displayMetrics?.avgResponseTime ? `${displayMetrics.avgResponseTime}s` : "12.4s"}
          icon={FiClock}
          change="30%"
          changeType="decrease"
          color="green"
        />
        <MetricsCard
          title="Customer Satisfaction"
          value={displayMetrics?.csat ? `${Math.round(displayMetrics.csat * 100)}%` : sentimentPercentage}
          icon={FiThumbsUp}
          change="7%"
          changeType="increase"
          color="purple"
        />
      </SimpleGrid>
      
      {/* Tabs - Mobile Responsive */}
      <Tabs variant="enclosed" colorScheme="brand" isLazy>
        <TabList overflowX={{ base: 'auto', md: 'visible' }} flexWrap={{ base: 'nowrap', md: 'wrap' }}>
          <Tab fontSize={{ base: 'sm', md: 'md' }}>All Conversations</Tab>
          <Tab fontSize={{ base: 'sm', md: 'md' }}>
            Needs Attention{' '}
            {highAlertConversations > 0 && (
              <Badge ml={2} colorScheme="red" borderRadius="full">
                {highAlertConversations}
              </Badge>
            )}
          </Tab>
          <Tab fontSize={{ base: 'sm', md: 'md' }}>Agent Performance</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={{ base: 0, md: 4 }}>
            <ConversationList 
              conversations={conversations}
              loading={loading.conversations}
              error={error.conversations}
            />
          </TabPanel>
          
          <TabPanel px={{ base: 0, md: 4 }}>
            <ConversationList 
              conversations={conversations.filter(conv => conv.alertLevel === 'high')}
              loading={loading.conversations}
              error={error.conversations}
            />
          </TabPanel>
          
          <TabPanel px={{ base: 0, md: 4 }}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {agents.map(agent => (
                <Box
                  key={agent.id}
                  bg={cardBg}
                  p={4}
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                    <Flex align="center">
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={agent.status === 'active' ? 'green.400' : 'gray.400'}
                        mr={3}
                      />
                      <Heading size={{ base: 'sm', md: 'md' }}>{agent.name}</Heading>
                    </Flex>
                    <Text fontSize="sm" color="gray.500">
                      {agent.model}
                    </Text>
                  </Flex>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Conversations
                      </Text>
                      <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
                        {agent.metrics?.conversations || 0}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Avg Response Time
                      </Text>
                      <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
                        {agent.metrics?.avgResponseTime || 0}s
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Satisfaction
                      </Text>
                      <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
                        {agent.metrics?.satisfaction ? `${Math.round(agent.metrics.satisfaction * 100)}%` : 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm">
                        Escalation Rate
                      </Text>
                      <Text fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
                        {agent.metrics?.escalationRate ? `${Math.round(agent.metrics.escalationRate * 100)}%` : 'N/A'}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Dashboard;