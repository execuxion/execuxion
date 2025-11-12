import customBlocks from '@business/blocks/index.js';
import { tasks } from './shared';

export function getBlocks() {
  return { ...tasks, ...customBlocks() };
}
