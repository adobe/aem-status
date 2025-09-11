import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Sample Test Suite', () => {
  describe('Basic Math Operations', () => {
    it('should add two numbers correctly', () => {
      const result = 2 + 2;
      assert.equal(result, 4);
    });

    it('should subtract two numbers correctly', () => {
      const result = 10 - 5;
      assert.equal(result, 5);
    });

    it('should handle string operations', () => {
      const str = 'Hello World';
      assert.equal(str, 'Hello World');
    });
  });

  describe('Array Operations', () => {
    it('should check if array includes value', () => {
      const arr = [1, 2, 3, 4, 5];
      assert.ok(arr.includes(3));
      assert.ok(!arr.includes(10));
    });

    it('should check array length', () => {
      const arr = ['a', 'b', 'c'];
      assert.equal(arr.length, 3);
    });
  });

  describe('Object Operations', () => {
    it('should deeply compare objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      assert.deepEqual(obj1, obj2);
    });

    it('should check object properties', () => {
      const obj = { name: 'test', value: 42 };
      assert.equal(obj.name, 'test');
      assert.equal(obj.value, 42);
    });
  });

  describe('Async Operations', () => {
    it('should handle async operations', async () => {
      const delayedValue = await new Promise((resolve) => {
        setTimeout(() => resolve('done'), 10);
      });
      assert.equal(delayedValue, 'done');
    });

    it('should reject promises correctly', async () => {
      await assert.rejects(
        async () => {
          throw new Error('Expected error');
        },
        {
          message: 'Expected error',
        },
      );
    });
  });
});
