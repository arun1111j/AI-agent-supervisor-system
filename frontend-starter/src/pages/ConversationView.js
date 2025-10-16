// src/pages/ConversationView.js
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Divider,
  Input,
  Textarea,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  useToast,
  Tooltip,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FiMic, FiMicOff, FiSend, FiFileText } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { addMessage, takeoverConversation, returnToAI } from '../api';

const ConversationView = () => {
  const { id } = useParams();
  const { conversations, templates, updateConversation } = useAppData();
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const toast = useToast();
  
  const { isOpen: isTemplateOpen, onOpen: onTemplateOpen, onClose: onTemplateClose } = useDisclosure();
  const { isOpen: isReturnOpen, onOpen: onReturnOpen, onClose: onReturnClose } = useDisclosure();

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: 'Voice Input Error',
          description: `Error: ${event.error}`,
          status: 'error',
          duration: 3000,
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [toast]);

  // Load conversation
  useEffect(() => {
    const conv = conversations.find(conv => conv.id === id || conv._id === id);
    setConversation(conv);
    if (conv) {
      setIsSupervisorMode(conv.supervisorControl || false);
    }
  }, [conversations, id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Voice input is not supported in your browser.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast({
        title: 'Listening...',
        description: 'Speak now. Click again to stop.',
        status: 'info',
        duration: 2000,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await addMessage(conversation.id || conversation._id, {
        text: message,
        sender: isSupervisorMode ? 'supervisor' : 'user',
      });
      
      setMessage('');
      toast({
        title: 'Message Sent',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleTakeover = async () => {
    try {
      await takeoverConversation(conversation.id || conversation._id, 'supervisor-1');
      setIsSupervisorMode(true);
      updateConversation(conversation.id || conversation._id, { supervisorControl: true });
      toast({
        title: 'Takeover Successful',
        description: 'You are now in control of this conversation',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to takeover conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleReturnToAI = async () => {
    try {
      await returnToAI(conversation.id || conversation._id, returnNotes);
      setIsSupervisorMode(false);
      setReturnNotes('');
      updateConversation(conversation.id || conversation._id, { supervisorControl: false });
      onReturnClose();
      toast({
        title: 'Returned to AI',
        description: 'AI agent has resumed control',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to return to AI',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    
    // Extract variables from template
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = [...template.content.matchAll(variableRegex)];
    const variables = {};
    matches.forEach(match => {
      variables[match[1]] = '';
    });
    setTemplateVariables(variables);
  };

  const handleTemplateUse = () => {
    let finalMessage = selectedTemplate.content;
    
    // Replace variables
    Object.keys(templateVariables).forEach(key => {
      finalMessage = finalMessage.replace(`{{${key}}}`, templateVariables[key]);
    });
    
    setMessage(finalMessage);
    onTemplateClose();
    setSelectedTemplate(null);
    setTemplateVariables({});
  };

  if (!conversation) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Text>Loading conversation...</Text>
      </Flex>
    );
  }

  return (
    <Flex p={{ base: 2, md: 4 }} gap={4} direction={{ base: 'column', lg: 'row' }} h="calc(100vh - 100px)">
      {/* Chat Area */}
      <Box flex="2" bg="white" borderRadius="xl" boxShadow="md" p={4} display="flex" flexDirection="column">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Conversation
          </Text>
          {isSupervisorMode && (
            <Badge colorScheme="purple">Supervisor Mode</Badge>
          )}
        </Flex>

        {/* Messages */}
        <VStack 
          align="start" 
          spacing={3} 
          flex="1" 
          overflowY="auto" 
          mb={4}
          px={2}
        >
          {conversation.messages?.map((msg, index) => (
            <Box
              key={index}
              alignSelf={msg.sender === 'agent' || msg.sender === 'supervisor' ? 'flex-end' : 'flex-start'}
              bg={
                msg.sender === 'supervisor' 
                  ? 'purple.100' 
                  : msg.sender === 'agent' 
                  ? 'blue.100' 
                  : 'gray.100'
              }
              p={3}
              borderRadius="md"
              maxWidth="75%"
            >
              <Text fontWeight="medium" fontSize="xs" color="gray.600" mb={1}>
                {msg.sender.toUpperCase()}
              </Text>
              <Text>{msg.text}</Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </VStack>

        {/* Input Area */}
        {isSupervisorMode ? (
          <VStack spacing={2} align="stretch">
            <HStack>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                size="md"
                resize="none"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <VStack spacing={2}>
                <Tooltip label={isRecording ? 'Stop Recording' : 'Start Voice Input'}>
                  <IconButton
                    icon={isRecording ? <FiMicOff /> : <FiMic />}
                    onClick={handleVoiceInput}
                    colorScheme={isRecording ? 'red' : 'gray'}
                    isRound
                  />
                </Tooltip>
                <Tooltip label="Use Template">
                  <IconButton
                    icon={<FiFileText />}
                    onClick={onTemplateOpen}
                    colorScheme="teal"
                    isRound
                  />
                </Tooltip>
                <Tooltip label="Send Message">
                  <IconButton
                    icon={<FiSend />}
                    onClick={handleSendMessage}
                    colorScheme="blue"
                    isRound
                  />
                </Tooltip>
              </VStack>
            </HStack>
            <Button colorScheme="orange" onClick={onReturnOpen} size="sm">
              Return to AI
            </Button>
          </VStack>
        ) : (
          <Button colorScheme="red" onClick={handleTakeover}>
            Take Over Conversation
          </Button>
        )}
      </Box>

      {/* Sidebar */}
      <Box 
        flex="1" 
        bg="gray.50" 
        borderRadius="xl" 
        boxShadow="md" 
        p={4}
        minW={{ base: 'full', lg: '300px' }}
      >
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Customer Info
        </Text>
        <HStack mb={3}>
          <Avatar name={conversation.customer?.name} size="md" />
          <Box>
            <Text fontWeight="medium">{conversation.customer?.name || 'Unknown'}</Text>
            <Text fontSize="sm" color="gray.600">
              {conversation.customer?.email || 'No email'}
            </Text>
          </Box>
        </HStack>
        
        <Divider my={4} />
        
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Conversation Status
        </Text>
        <VStack align="start" spacing={2}>
          <Badge colorScheme={conversation.status === 'active' ? 'green' : 'gray'}>
            {conversation.status}
          </Badge>
          <Text fontSize="sm">
            Started: {new Date(conversation.startedAt).toLocaleString()}
          </Text>
        </VStack>
        
        <Divider my={4} />
        
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Performance Metrics
        </Text>
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">
            Response Time: {conversation.metrics?.responseTime || 0} sec
          </Text>
          <Text fontSize="sm">
            Messages: {conversation.messages?.length || 0}
          </Text>
          <Text fontSize="sm">
            Sentiment: {conversation.metrics?.sentiment ? `${Math.round(conversation.metrics.sentiment * 100)}%` : 'N/A'}
          </Text>
        </VStack>
      </Box>

      {/* Template Selection Modal */}
      <Modal isOpen={isTemplateOpen} onClose={onTemplateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {!selectedTemplate ? (
              <VStack spacing={3} align="stretch">
                {templates.map((template) => (
                  <Box
                    key={template.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">{template.title}</Text>
                      <Badge colorScheme="blue">{template.category}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {template.content}
                    </Text>
                  </Box>
                ))}
                {templates.length === 0 && (
                  <Text textAlign="center" color="gray.500">
                    No templates available
                  </Text>
                )}
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Template: {selectedTemplate.title}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Fill in the variables below:
                  </Text>
                </Box>

                {Object.keys(templateVariables).map((varName) => (
                  <FormControl key={varName}>
                    <FormLabel fontSize="sm">{varName}</FormLabel>
                    <Input
                      value={templateVariables[varName]}
                      onChange={(e) =>
                        setTemplateVariables({
                          ...templateVariables,
                          [varName]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${varName}`}
                    />
                  </FormControl>
                ))}

                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Preview:
                  </Text>
                  <Text fontSize="sm">
                    {selectedTemplate.content.replace(
                      /\{\{(\w+)\}\}/g,
                      (match, varName) => templateVariables[varName] || match
                    )}
                  </Text>
                </Box>

                <HStack spacing={3}>
                  <Button
                    colorScheme="blue"
                    onClick={handleTemplateUse}
                    isDisabled={Object.values(templateVariables).some((v) => !v)}
                    flex="1"
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setTemplateVariables({});
                    }}
                    flex="1"
                  >
                    Back
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Return to AI Modal */}
      <Modal isOpen={isReturnOpen} onClose={onReturnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Return to AI Agent</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Notes for AI Agent (Optional)</FormLabel>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Add any context or instructions for the AI agent..."
                rows={4}
              />
            </FormControl>
            <HStack spacing={3} mt={4}>
              <Button colorScheme="blue" onClick={handleReturnToAI} flex="1">
                Confirm Return
              </Button>
              <Button variant="outline" onClick={onReturnClose} flex="1">
                Cancel
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default ConversationView;