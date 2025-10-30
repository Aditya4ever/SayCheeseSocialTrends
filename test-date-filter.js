const DateFilterUtils = require('./date-filter-utils');

// Test the 7-day filtering functionality
console.log('🧪 Testing 7-day date filtering...\n');

// Test dates
const today = new Date();
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

const testDates = [
  { label: 'Today', date: today, expected: true },
  { label: 'Yesterday', date: yesterday, expected: true },
  { label: '5 days ago', date: fiveDaysAgo, expected: true },
  { label: '7 days ago', date: sevenDaysAgo, expected: true },
  { label: '10 days ago', date: tenDaysAgo, expected: false }
];

console.log('Testing isWithinWeek function:');
testDates.forEach(test => {
  const result = DateFilterUtils.isWithinWeek(test.date.toISOString());
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${test.label}: ${result} (expected: ${test.expected})`);
});

console.log('\nTesting Reddit timestamp parsing:');
const redditTimestamp = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60); // 3 days ago
const redditISO = DateFilterUtils.parseRedditTime(redditTimestamp);
const isRecent = DateFilterUtils.isWithinWeek(redditISO);
console.log(`Reddit timestamp (3 days ago): ${isRecent ? '✅ RECENT' : '❌ OLD'}`);

console.log('\nTesting formatTimeAgo function:');
testDates.slice(0, 4).forEach(test => {
  const timeAgo = DateFilterUtils.formatTimeAgo(test.date.toISOString());
  console.log(`${test.label}: ${timeAgo}`);
});

console.log('\n📅 7-day filtering test complete!');

// Test with some sample data
console.log('\n🔍 Testing with sample data filtering...');

const sampleData = [
  { title: 'Recent Post 1', created: today.toISOString() },
  { title: 'Recent Post 2', created: fiveDaysAgo.toISOString() },
  { title: 'Old Post 1', created: tenDaysAgo.toISOString() },
  { title: 'Old Post 2', created: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() }
];

const filteredData = sampleData.filter(item => DateFilterUtils.isWithinWeek(item.created));
console.log(`Original data: ${sampleData.length} items`);
console.log(`Filtered data: ${filteredData.length} items (last 7 days only)`);
console.log('Filtered items:', filteredData.map(item => item.title));

console.log('\n🎯 All tests completed!');
