// routes/conversations.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const { simulateDelay } = require('../utils/helpers');

// Get all conversations with pagination and filtering
router.get('/', async(req, res, next) => {
    try {
        // Extract query parameters
        const { page = 1, limit = 10, status, alertLevel, agentId } = req.query;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (alertLevel) filter.alertLevel = alertLevel;
        if (agentId) filter['agent.id'] = agentId;

        // Get conversations
        const conversations = await Conversation.find(filter)
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Conversation.countDocuments(filter);

        await simulateDelay(300); // Simulate network delay

        res.json({
            data: conversations,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get a specific conversation by ID
router.get('/:id', async(req, res, next) => {
    try {
        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        await simulateDelay(200); // Simulate network delay

        res.json(conversation);
    } catch (error) {
        next(error);
    }
});


// Add a message to a conversation
router.post('/:id/messages', async(req, res, next) => {
    try {
        const { sender, text } = req.body;

        if (!sender || !text) {
            return res.status(400).json({ message: 'Sender and text are required' });
        }

        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const newMessage = {
            sender,
            text,
            timestamp: new Date()
        };

        conversation.messages.push(newMessage);

        // Update metrics based on new message
        if (sender === 'customer') {
            // Simulate sentiment analysis
            conversation.metrics.sentiment = Math.max(0.1, Math.min(1.0, conversation.metrics.sentiment - 0.1 + Math.random() * 0.2));
        }

        await conversation.save();

        // This would normally trigger a WebSocket update

        res.status(201).json(newMessage);
    } catch (error) {
        next(error);
    }
});

// Update conversation status
router.patch('/:id/status', async(req, res, next) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        conversation.status = status;

        // If resolved, set end time
        if (status === 'resolved') {
            conversation.endTime = new Date();
        }

        await conversation.save();

        res.json({ message: 'Status updated', status });
    } catch (error) {
        next(error);
    }
});

// Add tags to a conversation
router.post('/:id/tags', async(req, res, next) => {
    try {
        const { tags } = req.body;

        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({ message: 'Tags array is required' });
        }

        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Add new tags (avoid duplicates)
        const uniqueTags = [...new Set([...conversation.tags, ...tags])];
        conversation.tags = uniqueTags;

        await conversation.save();

        res.json({ message: 'Tags added', tags: conversation.tags });
    } catch (error) {
        next(error);
    }
});
// Add these to your existing routes/conversations.js

// Supervisor takes over conversation
router.post('/:id/takeover', async(req, res, next) => {
    try {
        const { supervisorId, supervisorName } = req.body;

        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Mark as supervisor-controlled
        conversation.isAIControlled = false;
        conversation.supervisorId = supervisorId || 'supervisor-001';
        conversation.supervisorName = supervisorName || 'Supervisor';
        conversation.status = 'active';

        // Add system message
        conversation.messages.push({
            sender: 'system',
            text: `${supervisorName || 'Supervisor'} has taken over this conversation`,
            timestamp: new Date()
        });

        await conversation.save();
        await simulateDelay(200);

        // Broadcast via WebSocket (if available)
        if (req.app.get('wss')) {
            const wss = req.app.get('wss');
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // OPEN state
                    client.send(JSON.stringify({
                        type: 'conversation_takeover',
                        conversationId: conversation.id,
                        supervisorId,
                        supervisorName,
                        timestamp: new Date()
                    }));
                }
            });
        }

        res.json({
            message: 'Conversation taken over successfully',
            conversation
        });
    } catch (error) {
        next(error);
    }
});

// Return control to AI
router.post('/:id/return-to-ai', async(req, res, next) => {
    try {
        const { notes } = req.body;

        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Return control to AI
        conversation.isAIControlled = true;
        const supervisorName = conversation.supervisorName;
        conversation.supervisorId = null;
        conversation.supervisorName = null;

        // Add system message with notes
        if (notes) {
            conversation.messages.push({
                sender: 'system',
                text: `${supervisorName} returned control to AI. Notes: ${notes}`,
                timestamp: new Date()
            });
        } else {
            conversation.messages.push({
                sender: 'system',
                text: `${supervisorName} returned control to AI`,
                timestamp: new Date()
            });
        }

        await conversation.save();
        await simulateDelay(200);

        // Broadcast via WebSocket
        if (req.app.get('wss')) {
            const wss = req.app.get('wss');
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'conversation_returned',
                        conversationId: conversation.id,
                        notes,
                        timestamp: new Date()
                    }));
                }
            });
        }

        res.json({
            message: 'Control returned to AI successfully',
            conversation
        });
    } catch (error) {
        next(error);
    }
});

// Get full conversation history
router.get('/:id/history', async(req, res, next) => {
    try {
        const conversation = await Conversation.findOne({ id: req.params.id });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        await simulateDelay(200);

        res.json({
            conversationId: conversation.id,
            customer: conversation.customer,
            agent: conversation.agent,
            messages: conversation.messages,
            status: conversation.status,
            isAIControlled: conversation.isAIControlled,
            supervisorId: conversation.supervisorId,
            supervisorName: conversation.supervisorName,
            startTime: conversation.startTime,
            endTime: conversation.endTime
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;