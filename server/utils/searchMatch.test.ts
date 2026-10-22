import { test } from 'node:test';
import assert from 'node:assert';
import { hasPrizeValue, matchesSearchTerm } from './searchMatch';

test('matches a skill case-insensitively inside a Devpost theme', () => {
  assert.strictEqual(matchesSearchTerm('AI', { skills: ['Machine Learning/AI'] }), true);
  assert.strictEqual(matchesSearchTerm('machine learning', { skills: ['Machine Learning/AI'] }), true);
});

test('matches terms by token boundary', () => {
  assert.strictEqual(matchesSearchTerm('web', { skills: ['Web Development'] }), true);
  assert.strictEqual(matchesSearchTerm('react', { title: 'React.js Challenge' }), true);
});

test('does not match inside unrelated words', () => {
  assert.strictEqual(matchesSearchTerm('ai', { title: 'Paid entry only hackathon' }), false);
  assert.strictEqual(matchesSearchTerm('ai', { description: 'A blockchain event' }), false);
});

test('falls back to title and description when skills are empty (MLH)', () => {
  assert.strictEqual(matchesSearchTerm('ai', { title: 'AI for Good Hackathon', skills: [] }), true);
  assert.strictEqual(
    matchesSearchTerm('climate', { description: 'Build climate solutions', skills: [] }),
    true
  );
  assert.strictEqual(
    matchesSearchTerm('robotics', { title: 'AI for Good', description: 'Build AI', skills: [] }),
    false
  );
});

test('ignores blank terms and missing fields', () => {
  assert.strictEqual(matchesSearchTerm('', { title: 'Anything' }), false);
  assert.strictEqual(matchesSearchTerm('   ', { title: 'Anything' }), false);
  assert.strictEqual(matchesSearchTerm('ai', { skills: [], title: null, description: null }), false);
});

test('treats real prize amounts as prizes', () => {
  assert.strictEqual(hasPrizeValue('$138,000'), true);
  assert.strictEqual(hasPrizeValue('$1,000 USD'), true);
  assert.strictEqual(hasPrizeValue(500), true);
});

test('rejects empty, zero and non-numeric prizes', () => {
  assert.strictEqual(hasPrizeValue('$0'), false);
  assert.strictEqual(hasPrizeValue('0'), false);
  assert.strictEqual(hasPrizeValue('$0.00'), false);
  assert.strictEqual(hasPrizeValue(''), false);
  assert.strictEqual(hasPrizeValue('No cash prize'), false);
  assert.strictEqual(hasPrizeValue(0), false);
  assert.strictEqual(hasPrizeValue(undefined), false);
  assert.strictEqual(hasPrizeValue(null), false);
});
