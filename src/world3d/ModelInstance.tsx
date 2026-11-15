import React, { useRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { WorldEntity } from '../shared/schemas/worldSchema';
import { ProceduralAsset, AssetRegistry } from './AssetRegistry';
import { eventBus } from '../shared/events/eventBus';
import { useDreamStore } from '../store/useDreamStore';
import { soundEngine } from '../sensory/SoundEngine';

interface ModelInstanceProps {
  entity: WorldEntity;
}

export const ModelInstance: React.FC<ModelInstanceProps> = ({ entity }) => {
  const lastDamageTimeRef = useRef<number>(0);
  const lastPortalTimeRef = useRef<number>(0);
  const isCollected = useDreamStore((state) => state.collectedEntityIds.includes(entity.id));
  const collectEntity = useDreamStore((state) => state.collectEntity);
  const playerHealth = useDreamStore((state) => state.playerHealth);
  const setPlayerHealth = useDreamStore((state) => state.setPlayerHealth);

  if (isCollected) {
    return null;
  }

  const handleInteraction = () => {
    switch (entity.interaction) {
      case 'collectible': {
        const collected = collectEntity(entity.id);
        if (collected) {
          soundEngine.playEventSfx('item-collected');
          eventBus.publish({
            type: 'item-collected',
            payload: {
              entityId: entity.id,
              asset: entity.asset,
              position: entity.position,
            },
          });
        }
        break;
      }

      case 'hazard': {
        if (playerHealth <= 0) return; // Prevent damage if already game over
        const now = performance.now();
        // 1200ms monotonic cooldown to prevent multi-frame physics damage drain
        if (now - lastDamageTimeRef.current >= 1200) {
          lastDamageTimeRef.current = now;
          setPlayerHealth((prev) => Math.max(0, prev - 15));
          soundEngine.playEventSfx('player-damaged');
          eventBus.publish({
            type: 'player-damaged',
            payload: { entityId: entity.id, damage: 15 },
          });
        }
        break;
      }

      case 'portal': {
        const now = performance.now();
        // 2000ms cooldown to avoid instant re-teleport loop
        if (now - lastPortalTimeRef.current >= 2000) {
          lastPortalTimeRef.current = now;
          // Target sanctuary high platform or safe forward offset
          const destination =
            entity.position.x === 0 && entity.position.z <= -20
              ? { x: 0, y: 3.5, z: -16 }
              : { x: entity.position.x, y: entity.position.y + 1.5, z: entity.position.z + 6 };

          soundEngine.playEventSfx('portal-entered');
          eventBus.publish({
            type: 'portal-entered',
            payload: { entityId: entity.id, destination },
          });
        }
        break;
      }
    }
  };

  const isSensor = entity.physics === 'sensor' || entity.interaction === 'collectible' || entity.interaction === 'portal';
  const colliderType = AssetRegistry.getAssetCollider(entity.asset);

  return (
    <RigidBody
      type={entity.physics === 'sensor' ? 'fixed' : entity.physics}
      sensor={isSensor}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
      colliders={colliderType}
      onIntersectionEnter={isSensor ? handleInteraction : undefined}
      onCollisionEnter={!isSensor && entity.interaction !== 'none' ? handleInteraction : undefined}
    >
      <ProceduralAsset asset={entity.asset} color={entity.color} />
    </RigidBody>
  );
};
