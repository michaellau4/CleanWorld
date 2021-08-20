import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export const player_state = (( ) => {

  class FiniteStateMachine {
    constructor() {
      this._states = {};
      this._currentState = null;
    }
  
    _AddState(name, type) {
      this._states[name] = type;
    }
  
    SetState(name) {
      const prevState = this._currentState;
      
      if (prevState) {
        if (prevState.Name == name) {
          return;
        }
        prevState.Exit();
      }
  
      const state = new this._states[name](this);
  
      this._currentState = state;
      state.Enter(prevState);
    }
  
    Update(timeElapsed, input) {
      if (this._currentState) {
        this._currentState.Update(timeElapsed, input);
      }
    }
  };
  
  
  class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this._Init();
    }
  
    _Init() {
      this._AddState('idle', IdleState);
      this._AddState('walk', WalkState);
      this._AddState('run', RunState);
      this._AddState('dance', DanceState);
      this._AddState('gather', GatherState);
    }
  };
  
  class State {
    constructor(parent) {
      this._parent = parent;
    }
  
    Enter() {}
    Exit() {}
    Update() {}
  };
  
  class GatherState extends State {
    constructor(parent) {
      super(parent);
  
      this._FinishedCallback = () => {
        this._Finished();
      }
    }
  
    get Name() {
      return 'gather';
    }
  
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['gather'].action;
      const mixer = curAction.getMixer();
      mixer.addEventListener('finished', this._FinishedCallback);
  
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
  
        curAction.reset();  
        curAction.setLoop(THREE.LoopOnce, 1);
        curAction.clampWhenFinished = true;
        curAction.crossFadeFrom(prevAction, 0.2, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    _Finished() {
      this._Cleanup();
      this._parent.SetState('idle');
    }
  
    _Cleanup() {
      const action = this._parent._proxy._animations['gather'].action;
      
      action.getMixer().removeEventListener('finished', this._CleanupCallback);
    }
  
    Exit() {
      this._Cleanup();
    }
  
    Update(_) {
    }
  };
  
  class DanceState extends State {
    constructor(parent) {
      super(parent);
  
      this._FinishedCallback = () => {
        this._Finished();
      }
    }
  
    get Name() {
      return 'gather';
    }
  
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['gather'].action;
      const mixer = curAction.getMixer();
      mixer.addEventListener('finished', this._FinishedCallback);
  
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
  
        curAction.reset();  
        curAction.setLoop(THREE.LoopOnce, 1);
        curAction.clampWhenFinished = true;
        curAction.crossFadeFrom(prevAction, 0.2, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    _Finished() {
      this._Cleanup();
      this._parent.SetState('idle');
    }
  
    _Cleanup() {
      const action = this._parent._proxy._animations['gather'].action;
      
      action.getMixer().removeEventListener('finished', this._CleanupCallback);
    }
  
    Exit() {
      this._Cleanup();
    }
  
    Update(_) {
    }
  };
  
  
  class WalkState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'walk';
    }
  
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['walk'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
  
        curAction.enabled = true;
  
        if (prevState.Name == 'run') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;
          curAction.setEffectiveTimeScale(1.0);
          curAction.setEffectiveWeight(1.0);
        }
  
        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(timeElapsed, input) {
      if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
          this._parent.SetState('run');
        }
        return;
      }
  
      this._parent.SetState('idle');
    }
  };
  
  
  class RunState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'run';
    }
  
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['run'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
  
        curAction.enabled = true;
  
        if (prevState.Name == 'walk') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;
          curAction.setEffectiveTimeScale(1.0);
          curAction.setEffectiveWeight(1.0);
        }
  
        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
      } else {
        curAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(timeElapsed, input) {
      if (input._keys.forward || input._keys.backward) {
        if (!input._keys.shift) {
          this._parent.SetState('walk');
        }
        return;
      }
  
      this._parent.SetState('idle');
    }
  };
  
  
  class IdleState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'idle';
    }
  
    Enter(prevState) {
      const idleAction = this._parent._proxy._animations['idle'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
        idleAction.crossFadeFrom(prevAction, 0.5, true);
        idleAction.play();
      } else {
        idleAction.play();
      }
    }
  
    Exit() {
    }
  
    Update(_, input) {
      if (input._keys.forward || input._keys.backward) {
        this._parent.SetState('walk');
      } else if (input._keys.space) {
        this._parent.SetState('dance');
      }
    }
  };
})