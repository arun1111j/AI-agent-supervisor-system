# Testing Checklist

## Dashboard Tests
- [ ] Dashboard loads without errors
- [ ] Metrics cards display correct data
- [ ] SSE connection establishes (check browser console)
- [ ] Metrics update every 2 seconds
- [ ] Mobile view: Metrics stack vertically
- [ ] Mobile view: Time range buttons wrap properly
- [ ] Mobile view: Table scrolls horizontally if needed
- [ ] Tabs switch correctly
- [ ] "Needs Attention" shows correct count

## Conversation View Tests
- [ ] Conversation loads with all messages
- [ ] Messages display with correct sender colors
- [ ] Auto-scroll to bottom works
- [ ] "Take Over" button works
- [ ] Supervisor mode activates correctly
- [ ] Message input accepts text
- [ ] **Voice input button appears**
- [ ] **Clicking mic button starts recording**
- [ ] **Speaking adds text to input field**
- [ ] **Clicking mic again stops recording**
- [ ] **Browser permission prompt appears (first time)**
- [ ] Template button opens modal
- [ ] Send button sends message
- [ ] "Return to AI" button works
- [ ] Return notes modal opens
- [ ] Customer info displays in sidebar
- [ ] Mobile view: Sidebar stacks below chat

## Voice Input Specific Tests
- [ ] Check browser console for Speech Recognition support
- [ ] Test in Chrome (best support)
- [ ] Test with microphone permission granted
- [ ] Test with microphone permission denied
- [ ] Test speech-to-text accuracy
- [ ] Test stopping mid-sentence
- [ ] Test multiple voice inputs in sequence
- [ ] Verify text appends (doesn't replace)

## Templates Tests
- [ ] Templates page loads
- [ ] "Create Template" button works
- [ ] Template form validates required fields
- [ ] Variables detected in template content
- [ ] Can save template
- [ ] Template appears in list
- [ ] Can edit template
- [ ] Can delete template (with confirmation)
- [ ] Shared toggle works
- [ ] Category filter works
- [ ] Mobile view: Cards stack in single column

## Template Usage in Conversation Tests
- [ ] Template button opens modal in conversation
- [ ] Templates list displays
- [ ] Clicking template shows variable input form
- [ ] All variables show input fields
- [ ] Preview updates as variables are filled
- [ ] "Use Template" disabled until all variables filled
- [ ] "Use Template" inserts text into message input
- [ ] Variables are properly replaced
- [ ] Can go back to template list
- [ ] Modal closes after use

## Mobile Responsive Tests
### Dashboard (Mobile - <768px)
- [ ] Header stacks vertically
- [ ] Metrics show 1-2 per row
- [ ] Buttons wrap to new line
- [ ] Font sizes readable
- [ ] Tabs scrollable horizontally

### Conversation (Mobile)
- [ ] Chat area full width
- [ ] Sidebar appears below (not side-by-side)
- [ ] Voice button larger/easier to tap
- [ ] Message input full width
- [ ] Action buttons stack vertically if needed

### Templates (Mobile)
- [ ] Cards show 1 per row
- [ ] Modal full screen on small devices
- [ ] Form inputs full width
- [ ] Buttons stack vertically

## API Integration Tests
- [ ] SSE connects successfully
- [ ] WebSocket connects successfully
- [ ] Metrics endpoint returns data
- [ ] Conversations endpoint returns data
- [ ] Templates endpoint returns data
- [ ] POST message works
- [ ] POST takeover works
- [ ] POST return works
- [ ] POST create template works
- [ ] PUT update template works
- [ ] DELETE template works

## Error Handling Tests
- [ ] Network errors show toast notification
- [ ] SSE disconnect attempts reconnect
- [ ] WebSocket disconnect attempts reconnect
- [ ] API errors don't crash app
- [ ] Voice input errors show notification
- [ ] Template validation errors show clearly
- [ ] Missing data shows placeholder/loading state

## Performance Tests
- [ ] Page loads quickly (<3s)
- [ ] No memory leaks (check DevTools Performance)
- [ ] SSE doesn't cause excessive re-renders
- [ ] Voice input doesn't lag
- [ ] Large conversation lists scroll smoothly
- [ ] Many templates render without lag