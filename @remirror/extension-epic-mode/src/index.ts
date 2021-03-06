import { EditorSchema, Extension, getPluginState, ProsemirrorPlugin } from '@remirror/core';
import { Plugin } from 'prosemirror-state';
import {
  COLORS,
  defaultEffect,
  heartEffect,
  PARTICLE_NUM_RANGE,
  spawningEffect,
  VIBRANT_COLORS,
} from './effects';
import { EpicModePluginState } from './state';
import {
  CreateParticleParams,
  EpicModeOptions,
  EpicModePluginStateParams,
  Particle,
  ParticleEffect,
  ParticleRange,
  UpdateParticleParams,
} from './types';

export class EpicMode extends Extension<EpicModeOptions> {
  get name() {
    return 'epicMode' as const;
  }

  get defaultOptions() {
    return {
      particleEffect: defaultEffect,
      canvasHolder: document.body,
      colors: VIBRANT_COLORS,
      particleRange: PARTICLE_NUM_RANGE,
      shake: true,
      shakeTime: 0.3,
    };
  }

  public plugin(): ProsemirrorPlugin {
    return createEpicModePlugin(this);
  }
}

const createEpicModePlugin = (ctx: Extension<EpicModeOptions>) => {
  const plugin = new Plugin<EpicModePluginState, EditorSchema>({
    key: ctx.pluginKey,
    state: {
      init() {
        return new EpicModePluginState(ctx.options);
      },
      apply(_tr, pluginState) {
        return pluginState;
      },
    },
    props: {
      handleKeyPress(view) {
        const pluginState = getPluginState<EpicModePluginState>(ctx.pluginKey, view.state);
        pluginState.shake(ctx.options.shakeTime);
        pluginState.spawnParticles();
        return false;
      },
    },
    view(view) {
      const pluginState = getPluginState<EpicModePluginState>(ctx.pluginKey, view.state).init(view);

      return {
        destroy() {
          pluginState.destroy();
        },
      };
    },
  });
  return plugin;
};

export type EpicModePluginState = typeof EpicModePluginState;

export {
  defaultEffect,
  spawningEffect,
  heartEffect,
  EpicModeOptions,
  ParticleEffect,
  Particle,
  ParticleRange,
  UpdateParticleParams,
  CreateParticleParams,
  EpicModePluginStateParams,
  COLORS,
  VIBRANT_COLORS,
};
