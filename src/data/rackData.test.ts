import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RACK_DIMS,
  rackUnitToY,
  rackUnitsHeight,
  validateSupportForm,
  calculateRackSummary,
  COMPONENT_LIST,
  CABLE_CATALOG,
  FIBER_OPTIONS,
} from './rackData';

test('rackUnitToY maps 1U..42U monotonically within cabinet height', () => {
  const y1 = rackUnitToY(1);
  const y21 = rackUnitToY(21);
  const y42 = rackUnitToY(42);

  assert.ok(y1 > RACK_DIMS.castorHeight + RACK_DIMS.baseThickness);
  assert.ok(y21 > y1);
  assert.ok(y42 > y21);
  assert.ok(y42 < RACK_DIMS.height);
  const delta = rackUnitToY(20) - rackUnitToY(19);
  assert.ok(Math.abs(delta - RACK_DIMS.uHeight) < 1e-6);
});

test('rackUnitToY clamps out-of-range U inputs safely', () => {
  assert.equal(rackUnitToY(0), rackUnitToY(1));
  assert.equal(rackUnitToY(99), rackUnitToY(42));
  assert.equal(rackUnitsHeight(2), 2 * RACK_DIMS.uHeight);
});

test('all 6 rack components (including top ventilation) have unique hotspot numbers and valid U ranges', () => {
  assert.equal(COMPONENT_LIST.length, 6);
  const nums = new Set(COMPONENT_LIST.map((c) => c.hotspotNumber));
  assert.equal(nums.size, 6);
  assert.ok(COMPONENT_LIST.some((c) => c.id === 'ventilation'));
  for (const comp of COMPONENT_LIST) {
    assert.ok(comp.uStart >= 1 && comp.uEnd <= 42 && comp.uEnd >= comp.uStart);
  }
});

test('3D cable catalog includes SC-APC, LC-APC, CPAs, and Cabo de Cobre with specs', () => {
  assert.equal(CABLE_CATALOG.length, 4);
  const ids = CABLE_CATALOG.map((c) => c.id);
  assert.deepEqual(ids, ['sc-apc', 'lc-apc', 'cpa', 'copper-cat6a']);
  for (const item of CABLE_CATALOG) {
    assert.ok(Object.keys(item.specs).length >= 5);
    assert.ok(item.ref.startsWith('BARPA-'));
  }
  assert.ok(FIBER_OPTIONS.some((f) => f.id === 'cpa-om4' && f.isCpa));
});

test('support form validation rejects invalid inputs and accepts complete entries', () => {
  const invalid = validateSupportForm({
    name: 'A',
    email: 'invalid-email',
    phone: '123',
    message: 'curta',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.message);

  const valid = validateSupportForm({
    name: 'Carlos Ferreira',
    email: 'carlos@instalacao.pt',
    phone: '+351 912 345 678',
    message: 'Necessito confirmação de guias laterais para Norma 1 42U.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('calculateRackSummary reflects selected cabling options and free U count', () => {
  const summary = calculateRackSummary('cat6a-orange', 'cpa-om4');
  assert.match(summary.copperLabel, /Cat\.6A/);
  assert.match(summary.fiberLabel, /CPA/);
  assert.equal(summary.occupiedU + summary.freeU, RACK_DIMS.totalU);
});
