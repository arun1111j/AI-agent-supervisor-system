// routes/analytics.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const { simulateDelay } = require('../utils/helpers');

// SSE endpoint for real-time metrics (updates every 2 seconds)
router.get('/metrics/stream', async(req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Function to calculate and send metrics
    const sendMetrics = async() => {
        try {
            const conversations = await Conversation.find();

            // Calculate CSAT (Customer Satisfaction Score)
            const sentiments = conversations
                .filter(c => c.metrics && c.metrics.sentiment)
                .map(c => c.metrics.sentiment);
            const avgSentiment = sentiments.length > 0 ?
                sentiments.reduce((a, b) => a + b, 0) / sentiments.length :
                0;
            const csat = (avgSentiment * 10).toFixed(1); // Convert to 0-10 scale

            // Calculate Average Response Time
            const responseTimes = conversations
                .filter(c => c.metrics && c.metrics.responseTime)
                .map(c => c.metrics.responseTime);
            const avgResponseTime = responseTimes.length > 0 ?
                Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) :
                0;

            // Active Conversations Count
            const activeConversations = conversations.filter(
                c => c.status === 'active' || c.status === 'waiting'
            ).length;

            // Escalation Rate
            const totalConversations = conversations.length || 1;
            const escalatedConversations = conversations.filter(
                c => c.status === 'escalated' || c.alertLevel === 'high'
            ).length;
            const escalationRate = Math.round((escalatedConversations / totalConversations) * 100);

            // Send data as SSE
            const data = {
                csat: parseFloat(csat),
                avgResponseTime,
                activeConversations,
                escalationRate,
                timestamp: new Date().toISOString()
            };

            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error('Error sending metrics:', error);
        }
    };

    // Send metrics immediately
    await sendMetrics();

    // Then send every 2 seconds
    const intervalId = setInterval(sendMetrics, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

// Get historical metrics
router.get('/', async(req, res, next) => {
    try {
        const conversations = await Conversation.find();

        // Aggregate metrics by day for the chart
        const dailyMetrics = [];
        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dayConvos = conversations.filter(c => {
                const convoDate = new Date(c.startTime);
                convoDate.setHours(0, 0, 0, 0);
                return convoDate.getTime() === date.getTime();
            });

            const sentiments = dayConvos
                .filter(c => c.metrics && c.metrics.sentiment)
                .map(c => c.metrics.sentiment);

            const avgSentiment = sentiments.length > 0 ?
                sentiments.reduce((a, b) => a + b, 0) / sentiments.length :
                0;

            dailyMetrics.push({
                date: date.toISOString().split('T')[0],
                csat: parseFloat((avgSentiment * 10).toFixed(1)),
                conversations: dayConvos.length
            });
        }

        await simulateDelay(300);

        res.json({
            daily: dailyMetrics,
            conversations: conversations.length,
            agents: [] // Could be populated from Agent model
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;