import VTooltip from '../directives/VTooltip';
import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

const uiComponents = import.meta.glob('../components/ui/*.vue', { eager: true });
const transitionComponents = import.meta.glob('../components/transitions/*.vue', { eager: true });

function componentsExtractor(app, components) {
  Object.keys(components).forEach((key) => {
    const componentName = key.replace(/.*\/(.+)\.vue$/, '$1');
    const component = components[key]?.default ?? {};

    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('tooltip', VTooltip);
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);

  componentsExtractor(app, uiComponents);
  componentsExtractor(app, transitionComponents);
}
