# Quick Feature Tests

## Test Voice Input:
1. Go to any conversation
2. Click "Take Over"
3. Click microphone button
4. Allow microphone permission if prompted
5. Say "Hello this is a test message"
6. Click microphone button again to stop
7. Verify text appears in input field
8. Click Send

## Test Templates:
1. Go to Templates page (/templates)
2. Click "Create Template"
3. Enter title: "Shipping Update"
4. Select category: "Shipping"
5. Enter content: "Hi {{customer_name}}, your order {{order_id}} will arrive on {{delivery_date}}"
6. Click Create
7. Go to a conversation
8. Click "Take Over"
9. Click template button (file icon)
10. Select "Shipping Update"
11. Fill in variables
12. Click "Use Template"
13. Verify message appears in input

## Test SSE Metrics:
1. Open Dashboard
2. Open browser DevTools > Network tab
3. Filter by "stream" or "metrics"
4. Should see EventSource connection
5. Watch metrics update every 2 seconds
6. Check Console for any errors

## Test Mobile Responsive:
1. Open DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Navigate through all pages
5. Check layouts stack correctly
6. Test touch interactions