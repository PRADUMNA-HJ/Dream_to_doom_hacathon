import React, { useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import type { WorldEntity } from '../shared/schemas/worldSchema';
import { ProceduralAsset } from './AssetRegistry';
import { eventBus } from '../shared/events/eventBus';
import { useDreamStore } from '../store/useDreamStore';

interface ModelInstanceProps {
  entity: WorldEntity;
}

export const ModelInstance: React.FC<ModelInstanceProps> = ({ entity }) => {
  const [isCollected, setIsCollected] = useState(false);
  const setScore = useDreamStore((state) => state.setScore);
  const setPlayerHealth = useDreamStore((state) => state.setPlayerHealth);

  if (isCollected) {
    return null;
  }

  const handleInteraction = () => {
    switch (entity.interaction) {
      case 'collectible':
        setIsCollected(true);
        setScore((prev) => prev + 10);
        eventBus.publish({
          type: 'item-collected',
          payload: { entityId: entity.id, asset: entity.asset },
        });
        break;

      case 'hazard':
        setPlayerHealth((prev) => prev - 15);
        eventBus.publish({
          type: 'player-damaged',
          payload: { entityId: entity.id, damage: 15 },
        });
        break;

      case 'portal':
        eventBus.publish({
          type: 'portal-entered',
          payload: { entityId: entity.id },
        });
        break;
    }
  };

  const isSensor = entity.physics === 'sensor' || entity.interaction === 'collectible' || entity.interaction === 'portal';

  return (
    <RigidBody
      type={entity.physics === 'sensor' ? 'fixed' : entity.physics}
      sensor={isSensor}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
      colliders={entity.asset === 'crystal' || entity.asset === 'enemy' ? 'ball' : 'cuboid'}
      onIntersectionEnter={isSensor ? handleInteraction : undefined}
      onCollisionEnter={!isSensor && entity.interaction !== 'none' ? handleInteraction : undefined}
    >
      <ProceduralAsset asset={entity.asset} color={entity.color} />
    </RigidBody>
  );
};
