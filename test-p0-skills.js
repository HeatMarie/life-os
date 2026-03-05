/**
 * Test script for P0 Claude Skills
 * Run with: node test-p0-skills.js
 * Requires: Dev server running on localhost:3000
 */

const BASE_URL = "http://localhost:3000";

// Color codes
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function testTaskParser(userInput, testName) {
  console.log(`\n📝 ${testName}`);
  console.log(`Input: "${userInput}"\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/tasks/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });

    const data = await response.json();

    if (response.ok && data.title) {
      log("green", "✅ PASS", `Task parser returned valid response`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Priority: ${data.priority}`);
      console.log(`  Energy Cost: ${data.suggestedEnergyCost}`);
      console.log(`  Confidence: ${data.confidence}`);
      console.log(`  Cached: ${data.meta?.cached || false}`);
      console.log(`  Tokens Used: ${data.meta?.tokensUsed || 0}`);
      console.log(`  Cost: $${data.meta?.cost?.toFixed(4) || 0}`);
      return { success: true, cached: data.meta?.cached };
    } else {
      log("red", "❌ FAIL", `Task parser failed`);
      console.log(JSON.stringify(data, null, 2));
      return { success: false };
    }
  } catch (error) {
    log("red", "❌ ERROR", error.message);
    return { success: false };
  }
}

async function testDailyPlanner() {
  console.log(`\n📅 Test: Daily Planner`);
  console.log(`Generating daily plan for today...\n`);

  try {
    const today = new Date().toISOString();
    const response = await fetch(`${BASE_URL}/api/ai/daily-planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today }),
    });

    const data = await response.json();

    if (response.ok && data.energyAnalysis) {
      log("green", "✅ PASS", `Daily planner returned valid response`);
      console.log(`  Available Energy: ${data.energyAnalysis.available}`);
      console.log(`  Required Energy: ${data.energyAnalysis.required}`);
      console.log(`  Surplus: ${data.energyAnalysis.surplus}`);
      console.log(`  Burnout Risk: ${data.burnoutRisk}`);
      console.log(`  Schedule Items: ${data.schedule?.length || 0}`);
      console.log(`  Warnings: ${data.warnings?.length || 0}`);
      if (data.warnings?.length > 0) {
        console.log(`  ⚠️  Warnings:`);
        data.warnings.forEach((w) => console.log(`     - ${w}`));
      }
      console.log(`  Task Count: ${data.meta?.taskCount || 0}`);
      console.log(`  Event Count: ${data.meta?.eventCount || 0}`);
      return { success: true };
    } else {
      log("red", "❌ FAIL", `Daily planner failed`);
      console.log(JSON.stringify(data, null, 2));
      return { success: false };
    }
  } catch (error) {
    log("red", "❌ ERROR", error.message);
    return { success: false };
  }
}

async function runTests() {
  console.log("\n🧪 Testing P0 Claude Skills");
  console.log("==============================\n");

  const results = [];

  // Test 1: Simple task
  results.push(
    await testTaskParser(
      "Schedule dentist appointment next Tuesday at 2pm",
      "Test 1: Simple Task"
    )
  );
  console.log("\n---");

  // Test 2: Complex task with priority
  results.push(
    await testTaskParser(
      "Write blog post about AI integration by end of week high priority",
      "Test 2: Complex Task with Priority"
    )
  );
  console.log("\n---");

  // Test 3: Short task
  results.push(
    await testTaskParser("Call mom tomorrow", "Test 3: Short Task")
  );
  console.log("\n---");

  // Test 4: Cache hit test (repeat test 1)
  const cacheTest = await testTaskParser(
    "Schedule dentist appointment next Tuesday at 2pm",
    "Test 4: Cache Hit Test (same as Test 1)"
  );
  if (cacheTest.cached) {
    log("green", "✅", "Cache working correctly!");
  } else {
    log("yellow", "⚠️", "Cache miss (might be expected on first run)");
  }
  results.push(cacheTest);
  console.log("\n---");

  // Test 5: Daily Planner
  results.push(await testDailyPlanner());
  console.log("\n---");

  // Summary
  console.log("\n==============================");
  console.log("📊 Test Summary");
  console.log("==============================");
  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    log("green", "✅", "All tests passed!");
  } else {
    log("yellow", "⚠️", `${total - passed} test(s) failed`);
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Check database for AIUsage entries:");
  console.log("   npx prisma studio → Open ai_usage table");
  console.log("2. Check cache entries:");
  console.log("   npx prisma studio → Open ai_cache_entries table");
  console.log("3. Monitor costs:");
  console.log("   Review 'cost' field in AIUsage records");
  console.log("");
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Main execution
(async () => {
  console.log("Checking if dev server is running...");
  const serverRunning = await checkServer();

  if (!serverRunning) {
    log(
      "red",
      "❌",
      "Dev server not running on localhost:3000. Please start it with 'npm run dev'"
    );
    process.exit(1);
  }

  log("green", "✅", "Server is running. Starting tests...");
  await runTests();
})();
