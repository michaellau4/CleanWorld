import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {entity} from './entity.js';
import {math} from './math.js';


export const pickup_controller = (() => {

  class PickupController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._timeElapsed = 0.0;
      this._action = null;
    }

    InitComponent() {
      this._RegisterHandler('player.action', (m) => { this._OnAnimAction(m); });
    }

    _OnAnimAction(m) {
      if (m.action != this._action) {
        this._action = m.action;
        this._timeElapsed = 0.0;
      }

      const oldTiming = this._timeElapsed;
      this._timeElapsed = m.time;

      if (oldTiming < this._params.timing && this._timeElapsed >= this._params.timing) {
        

        const grid = this.GetComponent('SpatialGridController');
        const nearby = grid.FindNearbyEntities(1);
        console.log(nearby);
        if (nearby) {
          for (let a of nearby) {
            let target = a.entity;
            let b = this.FindEntity(target._name)
            console.log(b);
            
          }
        }
        
      }
    }
  };

  return {
      PickupController: PickupController,
  };
})();