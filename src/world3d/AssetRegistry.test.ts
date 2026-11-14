import { describe, it, expect } from 'vitest';
import { AssetRegistry, ASSET_DEFINITIONS } from './AssetRegistry';
import { AssetTypeEnum, type AssetType } from '../shared/schemas/worldSchema';

describe('AssetRegistry Acceptance Tests (Part 14 & 15.C)', () => {
  const canonicalAssets: AssetType[] = [
    'tree',
    'rock',
    'house',
    'portal',
    'crystal',
    'enemy',
    'platform',
    'mushroom',
    'lamp',
    'cloud',
  ];

  it('confirms all 10 canonical asset taxonomy identifiers exist in schema and registry', () => {
    expect(canonicalAssets.length).toBe(10);
    canonicalAssets.forEach((asset) => {
      expect(AssetTypeEnum.options).toContain(asset);
      expect(ASSET_DEFINITIONS[asset]).toBeDefined();
    });
  });

  it('verifies getAssetRenderer returns a callable component for each canonical asset', () => {
    canonicalAssets.forEach((asset) => {
      const Renderer = AssetRegistry.getAssetRenderer(asset);
      expect(typeof Renderer).toBe('function');
    });
  });

  it('verifies all 10 assets return valid Rapier collider configurations', () => {
    canonicalAssets.forEach((asset) => {
      const collider = AssetRegistry.getAssetCollider(asset);
      expect(['ball', 'cuboid', 'hull']).toContain(collider);
    });

    // Specific collider checks
    expect(AssetRegistry.getAssetCollider('crystal')).toBe('ball');
    expect(AssetRegistry.getAssetCollider('enemy')).toBe('ball');
    expect(AssetRegistry.getAssetCollider('tree')).toBe('cuboid');
    expect(AssetRegistry.getAssetCollider('platform')).toBe('cuboid');
  });

  it('verifies default physics types for all 10 assets', () => {
    canonicalAssets.forEach((asset) => {
      const physics = AssetRegistry.getDefaultPhysics(asset);
      expect(['fixed', 'dynamic', 'sensor']).toContain(physics);
    });

    expect(AssetRegistry.getDefaultPhysics('portal')).toBe('sensor');
    expect(AssetRegistry.getDefaultPhysics('crystal')).toBe('sensor');
    expect(AssetRegistry.getDefaultPhysics('enemy')).toBe('dynamic');
  });

  it('verifies default interaction types for all 10 assets', () => {
    expect(AssetRegistry.getDefaultInteraction('crystal')).toBe('collectible');
    expect(AssetRegistry.getDefaultInteraction('enemy')).toBe('hazard');
    expect(AssetRegistry.getDefaultInteraction('portal')).toBe('portal');
    expect(AssetRegistry.getDefaultInteraction('tree')).toBe('none');
  });

  it('verifies default scale vectors for all 10 assets', () => {
    canonicalAssets.forEach((asset) => {
      const scale = AssetRegistry.getDefaultScale(asset);
      expect(scale.x).toBeGreaterThan(0);
      expect(scale.y).toBeGreaterThan(0);
      expect(scale.z).toBeGreaterThan(0);
    });
  });

  it('handles invalid or unknown asset IDs with safe fallbacks', () => {
    const invalidAsset = 'unknown_dragon' as AssetType;
    expect(AssetRegistry.getAssetCollider(invalidAsset)).toBe('cuboid');
    expect(AssetRegistry.getDefaultPhysics(invalidAsset)).toBe('fixed');
    expect(AssetRegistry.getDefaultInteraction(invalidAsset)).toBe('none');
  });
});
