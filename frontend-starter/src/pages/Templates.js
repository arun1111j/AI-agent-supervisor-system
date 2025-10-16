// src/pages/Templates.js - FIXED VERSION
import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';
import { useAppData } from '../context/AppDataContext';
import { createTemplate, updateTemplate as updateTemplateAPI, deleteTemplate as deleteTemplateAPI } from '../api';

const Templates = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAppData();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',        // FIXED: Changed from 'title' to 'name'
    content: '',
    category: 'general',
    isShared: false, // FIXED: Changed from 'shared' to 'isShared'
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const categories = [
    'General',
    'Shipping',
    'Returns',
    'Technical Support',
    'Billing',
    'Product Information',
  ];

  const handleOpen = (template = null) => {
    if (template) {
      setIsEditing(true);
      setSelectedTemplate(template);
      setFormData({
        name: template.name,        // FIXED: Changed from 'title'
        content: template.content,
        category: template.category,
        isShared: template.isShared, // FIXED: Changed from 'shared'
      });
    } else {
      setIsEditing(false);
      setSelectedTemplate(null);
      setFormData({
        name: '',        // FIXED: Changed from 'title'
        content: '',
        category: 'general',
        isShared: false, // FIXED: Changed from 'shared'
      });
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setSelectedTemplate(null);
    setFormData({
      name: '',        // FIXED: Changed from 'title'
      content: '',
      category: 'general',
      isShared: false, // FIXED: Changed from 'shared'
    });
  };

  const handleSave = async () => {
    // FIXED: Check for 'name' instead of 'title'
    if (!formData.name || !formData.content) {
      toast({
        title: 'Error',
        description: 'Name and content are required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      if (isEditing) {
        await updateTemplateAPI(selectedTemplate.id, formData);
        updateTemplate(selectedTemplate.id, formData);
        toast({
          title: 'Template Updated',
          status: 'success',
          duration: 2000,
        });
      } else {
        const newTemplate = await createTemplate(formData);
        addTemplate(newTemplate);
        toast({
          title: 'Template Created',
          status: 'success',
          duration: 2000,
        });
      }
      handleClose();
    } catch (error) {
      console.error('Save error:', error); // Added for debugging
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save template',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteTemplateAPI(id);
      deleteTemplate(id);
      toast({
        title: 'Template Deleted',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const extractVariables = (content) => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    return matches.map((match) => match[1]);
  };

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size={{ base: 'md', md: 'lg' }}>Response Templates</Heading>
          <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
            Create and manage reusable message templates
          </Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => handleOpen()}
          size={{ base: 'sm', md: 'md' }}
        >
          Create Template
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {templates.map((template) => {
          const variables = extractVariables(template.content);
          return (
            <Card key={template.id} variant="outline">
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {template.name}  {/* FIXED: Changed from template.title */}
                  </Text>
                  <Badge colorScheme="blue">{template.category}</Badge>
                </HStack>
              </CardHeader>
              
              <CardBody py={2}>
                <Text fontSize="sm" color="gray.600" noOfLines={3} mb={3}>
                  {template.content}
                </Text>
                
                {variables.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.500">
                      Variables:
                    </Text>
                    <Flex gap={1} flexWrap="wrap">
                      {variables.map((variable, idx) => (
                        <Badge key={idx} fontSize="xs" colorScheme="purple">
                          {variable}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
              </CardBody>
              
              <CardFooter pt={2}>
                <HStack spacing={2} w="full" justify="flex-end">
                  {template.isShared && (  // FIXED: Changed from template.shared
                    <Badge colorScheme="green" fontSize="xs">
                      Shared
                    </Badge>
                  )}
                  <IconButton
                    icon={<FiEdit2 />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpen(template)}
                    aria-label="Edit template"
                  />
                  <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(template.id)}
                    aria-label="Delete template"
                  />
                </HStack>
              </CardFooter>
            </Card>
          );
        })}
      </SimpleGrid>

      {templates.length === 0 && (
        <Flex justify="center" align="center" h="300px">
          <VStack spacing={4}>
            <Text color="gray.500">No templates yet</Text>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={() => handleOpen()}
            >
              Create Your First Template
            </Button>
          </VStack>
        </Flex>
      )}

      {/* Create/Edit Template Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Template' : 'Create New Template'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Template Name</FormLabel>  {/* FIXED: Changed label */}
                <Input
                  value={formData.name}  // FIXED: Changed from formData.title
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })  // FIXED
                  }
                  placeholder="e.g., Order Confirmation"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Template Content</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Hi {{customer_name}}, your order {{order_id}} has been confirmed..."
                  rows={6}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Use {`{{variable_name}}`} for placeholders
                </Text>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Share with team</FormLabel>
                <Switch
                  isChecked={formData.isShared}  // FIXED: Changed from formData.shared
                  onChange={(e) =>
                    setFormData({ ...formData, isShared: e.target.checked })  // FIXED
                  }
                />
              </FormControl>

              {formData.content && extractVariables(formData.content).length > 0 && (
                <Box p={3} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Detected Variables:
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {extractVariables(formData.content).map((variable, idx) => (
                      <Badge key={idx} colorScheme="blue">
                        {variable}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}

              <HStack spacing={3} pt={4}>
                <Button colorScheme="blue" onClick={handleSave} flex="1">
                  {isEditing ? 'Update' : 'Create'} Template
                </Button>
                <Button variant="outline" onClick={handleClose} flex="1">
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Templates;