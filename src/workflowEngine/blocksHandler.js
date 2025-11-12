import { toCamelCase } from '@/utils/helper';
import customHandlers from '@business/blocks/backgroundHandler';

const blocksHandler = import.meta.glob('./blocksHandler/handler*.js', { eager: true });
const handlers = Object.keys(blocksHandler).reduce((acc, key) => {
  const name = key.replace(/.*\/handler(.+)\.js$/, '$1');

  acc[toCamelCase(name)] = blocksHandler[key].default;

  return acc;
}, {});

export default function () {
  return {
    ...handlers,
    ...customHandlers(),
  };
}
