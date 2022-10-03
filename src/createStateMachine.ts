export interface IState<T> {
  initialState: string;
  states: {
    [key: string]: {
      transitions: {
        [key: string]: (meta: T) => boolean;
      };
      onEnter?: (meta: T) => void;
      onExit?: (meta: T) => void;
      onTick?: (meta: T) => void;
    };
  };
  onTransition?: (prevState: string, nextState: string, meta?: T) => void;
}

export interface IMachine<Meta, T extends IState<any>> {
  stateMachine: T;
  transtion: (state: keyof T["states"], meta: Meta) => void;
  currentState: keyof T["states"];
  tick: (meta: Meta) => void;
}

export function createStateMachine<
  Meta extends object,
  T extends IState<Meta> = IState<Meta>
>(state: T): () => IMachine<Meta, T> {
  const factory = () => {
    const machine = {
      currentState: state.initialState,
      stateMachine: state,
      transtion: (targetState: keyof T["states"], meta?: Meta) => {
        if (meta) machine.stateMachine.states[machine.currentState].onExit?.(meta);
        
        machine.stateMachine.onTransition?.(machine.currentState, targetState as string, meta);

        machine.currentState = targetState as string;
  
        if (meta) machine.stateMachine.states[machine.currentState].onEnter?.(meta);
      },
      tick: (meta: Meta) => {
        const currentState = state.states[machine.currentState as string];
        const transitions = currentState.transitions;
  
        for (let key in transitions) {
          if (transitions[key](meta)) {
            machine.transtion(key, meta);
            return;
          }
        }
  
        currentState.onTick?.(meta);
      }
    };

    return machine;
  }

  return factory;
}