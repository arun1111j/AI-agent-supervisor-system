// routes/templates.js
const express = require('express');
const router = express.Router();
const ResponseTemplate = require('../models/responseTemplate');
const { simulateDelay } = require('../utils/helpers');

// Get all templates with optional category filter
router.get('/', async(req, res, next) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};

        const templates = await ResponseTemplate.find(filter).sort({ usageCount: -1 });

        await simulateDelay(200);

        res.json(templates);
    } catch (error) {
        next(error);
    }
});

// Get single template
router.get('/:id', async(req, res, next) => {
    try {
        const template = await ResponseTemplate.findOne({ id: req.params.id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await simulateDelay(150);

        res.json(template);
    } catch (error) {
        next(error);
    }
});

// Create new template
router.post('/', async(req, res, next) => {
    try {
        const { name, content, category, isShared, createdBy } = req.body;

        if (!name || !content || !category) {
            return res.status(400).json({
                message: 'Name, content, and category are required'
            });
        }

        // Extract variables from content ({{variable_name}} pattern)
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables = [];
        let match;

        while ((match = variableRegex.exec(content)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }

        // Generate unique ID
        const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const template = new ResponseTemplate({
            id,
            name,
            content,
            category,
            variables,
            isShared: isShared || false,
            createdBy: createdBy || 'unknown',
            usageCount: 0
        });

        await template.save();
        await simulateDelay(250);

        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
});

// Update template
router.put('/:id', async(req, res, next) => {
    try {
        const { name, content, category, isShared } = req.body;

        const template = await ResponseTemplate.findOne({ id: req.params.id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Update fields
        if (name) template.name = name;
        if (category) template.category = category;
        if (typeof isShared !== 'undefined') template.isShared = isShared;

        // If content changed, re-extract variables
        if (content) {
            template.content = content;

            const variableRegex = /\{\{(\w+)\}\}/g;
            const variables = [];
            let match;

            while ((match = variableRegex.exec(content)) !== null) {
                if (!variables.includes(match[1])) {
                    variables.push(match[1]);
                }
            }

            template.variables = variables;
        }

        template.updatedAt = new Date();

        await template.save();
        await simulateDelay(250);

        res.json(template);
    } catch (error) {
        next(error);
    }
});

// Delete template
router.delete('/:id', async(req, res, next) => {
    try {
        const template = await ResponseTemplate.findOneAndDelete({ id: req.params.id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await simulateDelay(200);

        res.json({
            message: 'Template deleted successfully',
            deletedTemplate: template
        });
    } catch (error) {
        next(error);
    }
});

// Increment usage count when template is used
router.post('/:id/use', async(req, res, next) => {
    try {
        const template = await ResponseTemplate.findOne({ id: req.params.id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        template.usageCount += 1;
        template.lastUsed = new Date();

        await template.save();

        res.json({
            message: 'Usage count incremented',
            usageCount: template.usageCount
        });
    } catch (error) {
        next(error);
    }
});

// Fill template variables and preview
router.post('/:id/fill', async(req, res, next) => {
    try {
        const { variables } = req.body;

        const template = await ResponseTemplate.findOne({ id: req.params.id });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Replace variables in content
        let filledContent = template.content;

        if (variables) {
            Object.keys(variables).forEach(varName => {
                const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
                filledContent = filledContent.replace(regex, variables[varName]);
            });
        }

        await simulateDelay(150);

        res.json({
            originalContent: template.content,
            filledContent,
            variables: template.variables,
            providedValues: variables
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;