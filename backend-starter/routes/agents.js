// routes/agents.js
const express = require('express');
const router = express.Router();
const Agent = require('../models/agent');
const { simulateDelay } = require('../utils/helpers');

// Get all agents
router.get('/', async(req, res, next) => {
    try {
        const agents = await Agent.find();

        await simulateDelay(200); // Simulate network delay

        res.json(agents);
    } catch (error) {
        next(error);
    }
});

// Get a specific agent
router.get('/:id', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        await simulateDelay(200); // Simulate network delay

        res.json(agent);
    } catch (error) {
        next(error);
    }
});

// Update agent configuration
router.patch('/:id/config', async(req, res, next) => {
    try {
        const { parameters, capabilities, knowledgeBases, escalationThresholds } = req.body;

        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        // Update only provided fields
        if (parameters) agent.parameters = {...agent.parameters, ...parameters };

        if (capabilities) {
            capabilities.forEach(cap => {
                const existing = agent.capabilities.find(c => c.id === cap.id);
                if (existing) {
                    existing.enabled = cap.enabled;
                }
            });
        }

        if (knowledgeBases) {
            knowledgeBases.forEach(kb => {
                const existing = agent.knowledgeBases.find(k => k.id === kb.id);
                if (existing) {
                    existing.enabled = kb.enabled;
                }
            });
        }

        if (escalationThresholds) {
            agent.escalationThresholds = {...agent.escalationThresholds, ...escalationThresholds };
        }

        await agent.save();

        await simulateDelay(300); // Simulate network delay

        res.json({ message: 'Agent configuration updated', agent });
    } catch (error) {
        next(error);
    }
});

// Get agent performance metrics
router.get('/:id/metrics', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        // This would normally fetch metrics from analytics service
        const metrics = agent.metrics || {
            conversations: 0,
            avgResponseTime: 0,
            satisfaction: 0,
            escalationRate: 0,
            topIssues: []
        };

        await simulateDelay(300); // Simulate network delay

        res.json(metrics);
    } catch (error) {
        next(error);
    }
});
// Add to your existing routes/agents.js

// Save configuration preset
router.post('/config/presets', async(req, res, next) => {
    try {
        const { name, agentId, configuration } = req.body;

        if (!name || !agentId || !configuration) {
            return res.status(400).json({
                message: 'Name, agentId, and configuration are required'
            });
        }

        const agent = await Agent.findOne({ id: agentId });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        // Initialize presets array if it doesn't exist
        if (!agent.configPresets) {
            agent.configPresets = [];
        }

        // Add new preset
        const preset = {
            id: `preset-${Date.now()}`,
            name,
            configuration,
            createdAt: new Date()
        };

        agent.configPresets.push(preset);
        await agent.save();
        await simulateDelay(250);

        res.status(201).json({
            message: 'Configuration preset saved',
            preset
        });
    } catch (error) {
        next(error);
    }
});

// Get all presets for an agent
router.get('/:id/config/presets', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        await simulateDelay(200);

        res.json(agent.configPresets || []);
    } catch (error) {
        next(error);
    }
});

// Load a configuration preset
router.post('/:id/config/presets/:presetId/load', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        const presets = agent.configPresets || [];
        const preset = presets.find(p => p.id === req.params.presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        // Apply preset configuration
        if (preset.configuration && preset.configuration.parameters) {
            agent.parameters = {...agent.parameters, ...preset.configuration.parameters };
        }

        if (preset.configuration && preset.configuration.capabilities) {
            agent.capabilities = preset.configuration.capabilities;
        }

        if (preset.configuration && preset.configuration.escalationThresholds) {
            agent.escalationThresholds = preset.configuration.escalationThresholds;
        }

        await agent.save();
        await simulateDelay(300);

        res.json({
            message: 'Configuration preset loaded successfully',
            agent
        });
    } catch (error) {
        next(error);
    }
});
// Save configuration preset
router.post('/config/presets', async(req, res, next) => {
    try {
        const { name, agentId, configuration } = req.body;

        if (!name || !agentId || !configuration) {
            return res.status(400).json({
                message: 'Name, agentId, and configuration are required'
            });
        }

        const agent = await Agent.findOne({ id: agentId });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        if (!agent.configPresets) {
            agent.configPresets = [];
        }

        const preset = {
            id: `preset-${Date.now()}`,
            name,
            configuration,
            createdAt: new Date()
        };

        agent.configPresets.push(preset);
        await agent.save();
        await simulateDelay(250);

        res.status(201).json({
            message: 'Configuration preset saved',
            preset
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/config/presets', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        await simulateDelay(200);

        res.json(agent.configPresets || []);
    } catch (error) {
        next(error);
    }
});

router.post('/:id/config/presets/:presetId/load', async(req, res, next) => {
    try {
        const agent = await Agent.findOne({ id: req.params.id });

        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        const presets = agent.configPresets || [];
        const preset = presets.find(p => p.id === req.params.presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        if (preset.configuration && preset.configuration.parameters) {
            agent.parameters = {...agent.parameters, ...preset.configuration.parameters };
        }

        if (preset.configuration && preset.configuration.capabilities) {
            agent.capabilities = preset.configuration.capabilities;
        }

        if (preset.configuration && preset.configuration.escalationThresholds) {
            agent.escalationThresholds = preset.configuration.escalationThresholds;
        }

        await agent.save();
        await simulateDelay(300);

        res.json({
            message: 'Configuration preset loaded successfully',
            agent
        });
    } catch (error) {
        next(error);
    }
});
module.exports = router;