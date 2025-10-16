// routes/metrics.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const Agent = require('../models/agent');

// SSE endpoint for real-time metrics
router.get('/stream', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial metrics
    sendMetrics(res);

    // Send metrics every 5 seconds
    const intervalId = setInterval(() => {
        sendMetrics(res);
    }, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

// Helper function to calculate and send metrics
async function sendMetrics(res) {
    try {
        const now = new Date();
        const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
        const lastHour = new Date(now - 60 * 60 * 1000);

        // Get conversation metrics
        const [
            totalConversations,
            activeConversations,
            resolvedToday,
            avgResponseTime,
            recentConversations
        ] = await Promise.all([
            Conversation.countDocuments(),
            Conversation.countDocuments({ status: 'active' }),
            Conversation.countDocuments({
                status: 'resolved',
                updatedAt: { $gte: last24Hours }
            }),
            calculateAvgResponseTime(),
            Conversation.countDocuments({ createdAt: { $gte: lastHour } })
        ]);

        // Get agent metrics
        const agents = await Agent.find();
        const agentMetrics = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            activeConversations: agent.activeConversations || 0,
            totalHandled: agent.totalHandled || 0
        }));

        // Calculate satisfaction rate (mock for now)
        const satisfactionRate = 4.2;

        const metrics = {
            timestamp: now.toISOString(),
            conversations: {
                total: totalConversations,
                active: activeConversations,
                resolved: resolvedToday,
                recent: recentConversations
            },
            performance: {
                avgResponseTime: avgResponseTime || 0,
                satisfactionRate: satisfactionRate
            },
            agents: agentMetrics
        };

        // Send as SSE
        res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
        console.error('Error sending metrics:', error);
    }
}

// Calculate average response time
async function calculateAvgResponseTime() {
    try {
        const conversations = await Conversation.find({
            status: { $in: ['active', 'resolved'] }
        }).limit(100);

        if (conversations.length === 0) return 0;

        let totalTime = 0;
        let count = 0;

        conversations.forEach(conv => {
            if (conv.messages && conv.messages.length > 1) {
                for (let i = 1; i < conv.messages.length; i++) {
                    const prevMsg = conv.messages[i - 1];
                    const currMsg = conv.messages[i];

                    if (prevMsg.sender === 'user' && currMsg.sender === 'agent') {
                        const timeDiff = new Date(currMsg.timestamp) - new Date(prevMsg.timestamp);
                        totalTime += timeDiff;
                        count++;
                    }
                }
            }
        });

        return count > 0 ? Math.round(totalTime / count / 1000) : 0; // Return in seconds
    } catch (error) {
        console.error('Error calculating response time:', error);
        return 0;
    }
}

// Get current metrics snapshot (REST endpoint)
router.get('/', async(req, res, next) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

        const [
            totalConversations,
            activeConversations,
            resolvedToday,
            avgResponseTime
        ] = await Promise.all([
            Conversation.countDocuments(),
            Conversation.countDocuments({ status: 'active' }),
            Conversation.countDocuments({
                status: 'resolved',
                updatedAt: { $gte: last24Hours }
            }),
            calculateAvgResponseTime()
        ]);

        const agents = await Agent.find();
        const agentMetrics = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            status: agent.status,
            activeConversations: agent.activeConversations || 0,
            totalHandled: agent.totalHandled || 0
        }));

        res.json({
            conversations: {
                total: totalConversations,
                active: activeConversations,
                resolved: resolvedToday
            },
            performance: {
                avgResponseTime: avgResponseTime || 0,
                satisfactionRate: 4.2
            },
            agents: agentMetrics
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;