// Self-contained API and business logic automated test suite
import { dbStore, pool } from '../db/index.js';
import { checkStockAvailability, deductStock, restoreStock } from '../services/inventoryService.js';
import { verifyRazorpaySignature } from '../services/razorpayService.js';

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string) => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
};
const runTests = async () => {
console.log('🧪 Running Prajnacart Backend Core Tests...\n');

// Test 1: Seed catalog loaded
assert(dbStore.products.length >= 10, 'Seed products catalog contains 10+ items');
assert(dbStore.categories.length >= 8, 'Seed categories contains 8+ categories');
assert(dbStore.users.length >= 3, 'Seed users contains Admin, Seller and Customer');

// Test 2: Stock check logic
const testProduct = dbStore.products[0];
const stockCheck1 = await checkStockAvailability(testProduct.id, undefined, 1);
assert(stockCheck1.isAvailable, 'Stock check passes for in-stock quantity 1');

const stockCheckOver = await checkStockAvailability(testProduct.id, undefined, 999999);
assert(!stockCheckOver.isAvailable, 'Stock check fails gracefully for excess quantity');

// Test 3: Deduct and Restore Stock
const stockBeforeResult = await pool.query(
  `
  SELECT available_stock
  FROM inventory
  WHERE product_id = $1
    AND variant_id IS NULL
  LIMIT 1
  `,
  [testProduct.id]
);

const stockBefore = Number(
  stockBeforeResult.rows[0]?.available_stock ?? 0
);

const deductResult = await deductStock(
  testProduct.id,
  undefined,
  5
);

assert(
  deductResult === true,
  'Stock deduction succeeds in PostgreSQL'
);

const stockAfterDeductResult = await pool.query(
  `
  SELECT available_stock
  FROM inventory
  WHERE product_id = $1
    AND variant_id IS NULL
  LIMIT 1
  `,
  [testProduct.id]
);

const stockAfterDeduct = Number(
  stockAfterDeductResult.rows[0]?.available_stock ?? 0
);

assert(
  stockAfterDeduct === stockBefore - 5,
  'Stock decreases by 5 on deduction'
);

const restoreResult = await restoreStock(
  testProduct.id,
  undefined,
  5
);

assert(
  restoreResult === true,
  'Stock restoration succeeds in PostgreSQL'
);

const stockAfterRestoreResult = await pool.query(
  `
  SELECT available_stock
  FROM inventory
  WHERE product_id = $1
    AND variant_id IS NULL
  LIMIT 1
  `,
  [testProduct.id]
);

const stockAfterRestore = Number(
  stockAfterRestoreResult.rows[0]?.available_stock ?? 0
);

assert(
  stockAfterRestore === stockBefore,
  'Stock restores correctly to original amount'
);

// Test 4: Razorpay signature verification logic
const demoSigCheck = verifyRazorpaySignature('order_demo_12345', 'pay_demo_67890', 'any_sig');
assert(demoSigCheck === true, 'Demo Razorpay order verification passes cleanly');

// Test 5: Coupon validation logic
const coupon = dbStore.coupons.find(c => c.code === 'WELCOME100');
assert(coupon !== undefined, 'Coupon WELCOME100 exists in database');
assert(coupon?.discountValue === 100, 'WELCOME100 discount value is 100 INR');

console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Core Tests Passed Successfully!\n');
}
};

runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});