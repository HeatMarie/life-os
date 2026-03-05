#!/bin/bash

# Test script for P0 Claude Skills
# Run this after starting the dev server (npm run dev)

BASE_URL="http://localhost:3000"

echo "🧪 Testing P0 Claude Skills"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Task Parser - Simple task
echo "📝 Test 1: Task Parser - Simple task"
echo "Input: 'Schedule dentist appointment next Tuesday at 2pm'"
echo ""
RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks/parse" \
  -H "Content-Type: application/json" \
  -d '{"userInput": "Schedule dentist appointment next Tuesday at 2pm"}')

if echo "$RESPONSE" | jq -e '.title' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Task parser returned valid response"
  echo "Title: $(echo "$RESPONSE" | jq -r '.title')"
  echo "Priority: $(echo "$RESPONSE" | jq -r '.priority')"
  echo "Energy Cost: $(echo "$RESPONSE" | jq -r '.suggestedEnergyCost')"
  echo "Confidence: $(echo "$RESPONSE" | jq -r '.confidence')"
  echo "Cached: $(echo "$RESPONSE" | jq -r '.meta.cached')"
else
  echo -e "${RED}❌ FAIL${NC} - Task parser failed"
  echo "$RESPONSE" | jq '.'
fi
echo ""
echo "---"
echo ""

# Test 2: Task Parser - Complex task with priority
echo "📝 Test 2: Task Parser - Complex task"
echo "Input: 'Write blog post about AI integration by end of week high priority'"
echo ""
RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks/parse" \
  -H "Content-Type: application/json" \
  -d '{"userInput": "Write blog post about AI integration by end of week high priority"}')

if echo "$RESPONSE" | jq -e '.title' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Complex task parsed successfully"
  echo "Title: $(echo "$RESPONSE" | jq -r '.title')"
  echo "Priority: $(echo "$RESPONSE" | jq -r '.priority')"
  echo "Energy Cost: $(echo "$RESPONSE" | jq -r '.suggestedEnergyCost')"
  echo "Due Date: $(echo "$RESPONSE" | jq -r '.suggestedDueDate // "none"')"
  echo "Cached: $(echo "$RESPONSE" | jq -r '.meta.cached')"
else
  echo -e "${RED}❌ FAIL${NC} - Complex task parsing failed"
  echo "$RESPONSE" | jq '.'
fi
echo ""
echo "---"
echo ""

# Test 3: Task Parser - Cache hit (repeat test 1)
echo "📝 Test 3: Task Parser - Cache Hit Test"
echo "Input: Same as Test 1 (should be cached)"
echo ""
RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks/parse" \
  -H "Content-Type: application/json" \
  -d '{"userInput": "Schedule dentist appointment next Tuesday at 2pm"}')

if echo "$RESPONSE" | jq -r '.meta.cached' | grep -q "true"; then
  echo -e "${GREEN}✅ PASS${NC} - Cache hit detected!"
  echo "Cached: $(echo "$RESPONSE" | jq -r '.meta.cached')"
  echo "Tokens Used: $(echo "$RESPONSE" | jq -r '.meta.tokensUsed')"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Cache miss (might be expected on first run)"
  echo "Cached: $(echo "$RESPONSE" | jq -r '.meta.cached')"
fi
echo ""
echo "---"
echo ""

# Test 4: Daily Planner
echo "📅 Test 4: Daily Planner"
echo "Generating daily plan for today..."
echo ""
TODAY=$(date -u +"%Y-%m-%dT00:00:00.000Z")
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/daily-planner" \
  -H "Content-Type: application/json" \
  -d "{\"date\": \"$TODAY\"}")

if echo "$RESPONSE" | jq -e '.energyAnalysis' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Daily planner returned valid response"
  echo "Available Energy: $(echo "$RESPONSE" | jq -r '.energyAnalysis.available')"
  echo "Required Energy: $(echo "$RESPONSE" | jq -r '.energyAnalysis.required')"
  echo "Surplus: $(echo "$RESPONSE" | jq -r '.energyAnalysis.surplus')"
  echo "Burnout Risk: $(echo "$RESPONSE" | jq -r '.burnoutRisk')"
  echo "Schedule Items: $(echo "$RESPONSE" | jq -r '.schedule | length')"
  echo "Warnings: $(echo "$RESPONSE" | jq -r '.warnings | length')"
  echo "Task Count: $(echo "$RESPONSE" | jq -r '.meta.taskCount')"
  echo "Event Count: $(echo "$RESPONSE" | jq -r '.meta.eventCount')"
else
  echo -e "${RED}❌ FAIL${NC} - Daily planner failed"
  echo "$RESPONSE" | jq '.'
fi
echo ""
echo "---"
echo ""

# Test 5: Rate Limiting (if we want to test it)
echo "🚦 Test 5: Rate Limiting Check"
echo "Making 3 rapid requests to check rate limiting..."
echo ""
for i in {1..3}; do
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks/parse" \
    -H "Content-Type: application/json" \
    -d '{"userInput": "Test task number '$i'"}')

  if echo "$RESPONSE" | jq -e '.error' | grep -q "quota exceeded"; then
    echo -e "${YELLOW}⚠️  Rate limit hit on request $i${NC}"
    echo "Reset at: $(echo "$RESPONSE" | jq -r '.resetAt // "N/A"')"
    break
  else
    echo "Request $i: Success (Cached: $(echo "$RESPONSE" | jq -r '.meta.cached // "N/A"'))"
  fi
done
echo ""
echo "---"
echo ""

echo "=============================="
echo "✅ P0 Skills Testing Complete"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Check database for AIUsage entries: Check the ai_usage table"
echo "2. Check cache entries: Look at ai_cache_entries table"
echo "3. Monitor costs: Review cost field in AIUsage records"
echo ""
echo "Tip: Run 'npx prisma studio' to view database records"
