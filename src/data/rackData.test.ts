import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_COMPONENT_IDS,
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

test('all 9 installable rack products have unique hotspot numbers, valid U ranges, and installation steps', () => {
  assert.equal(COMPONENT_LIST.length, 9);
  const nums = new Set(COMPONENT_LIST.map((c) => c.hotspotNumber));
  assert.equal(nums.size, 9);
  assert.ok(COMPONENT_LIST.some((c) => c.id === 'ventilation'));
  assert.ok(COMPONENT_LIST.some((c) => c.id === 'core-switch'));
  assert.ok(COMPONENT_LIST.some((c) => c.id === 'pdu-bar'));
  for (const comp of COMPONENT_LIST) {
    assert.ok(comp.uStart >= 1 && comp.uEnd <= 42 && comp.uEnd >= comp.uStart);
    assert.ok(comp.ref.startsWith('BARPA-'));
    assert.ok(comp.mountingHardware.length > 5);
    assert.ok(comp.tools.length > 3);
    assert.ok(comp.installSteps.length >= 3);
    assert.equal(comp.slotBox.center.length, 3);
    assert.equal(comp.slotBox.size.length, 3);
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

test('calculateRackSummary starts at 0U when empty and updates dynamically with installed components', () => {
  const empty = calculateRackSummary('mixed-norma1', 'os2-sc-apc', []);
  assert.equal(empty.installedCount, 0);
  assert.equal(empty.totalProducts, 9);
  assert.equal(empty.occupiedU, 0);
  assert.equal(empty.freeU, RACK_DIMS.totalU);

  const partial = calculateRackSummary('cat6a-orange', 'cpa-om4', [
    'pp-fiber',
    'pp-fiber',
    'core-switch',
    'ventilation',
  ]);
  assert.equal(partial.installedCount, 3);
  assert.equal(partial.occupiedU, 4); // 3U fiber + 1U switch + 0U roof ventilation
  assert.equal(partial.freeU, 38);

  const full = calculateRackSummary('cat6a-orange', 'cpa-om4', ALL_COMPONENT_IDS);
  assert.equal(full.installedCount, 9);
  assert.equal(full.occupiedU + full.freeU, RACK_DIMS.totalU);
  assert.ok(full.occupiedU > 0);
});
