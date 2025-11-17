# Block Development Guide

Comprehensive technical reference for adding blocks to Execuxion/Automa workflow automation.

## Execution Flow
```
User drags block → Canvas → Double-click → Edit component (sidebar) → Configure → block.data storage
Execute: WorkflowEngine.init() → WorkflowWorker.executeBlock() → blocksHandler[type]() → WorkflowLogger.log() (auto) → Next block
```

## Core File Locations
- **Registry**: `src/utils/shared.js` - Block metadata, connections, data schemas
- **Handlers**: `src/workflowEngine/blocksHandler/handler[Name].js` - Execution logic
- **Edit UI**: `src/components/newtab/workflow/edit/Edit[Name].vue` - Config components
- **i18n**: `src/locales/en/blocks.json` - Translations
- **Orchestrator**: `src/workflowEngine/WorkflowWorker.js` - Stop checks here
- **Logger**: `src/workflowEngine/WorkflowLogger.js` - Auto-logging (never log manually)

## Block Definition (shared.js)

```javascript
'block-id': {
  name: 'Display Name',                    // Short label
  description: 'Block purpose',            // Brief explanation
  searchKeywords: 'keyword1 keyword2',     // Search terms (space-separated)
  icon: 'riIconName',                      // Remixicon or SVG URL
  component: 'BlockBasic',                 // Visual type (see Connection Types)
  editComponent: 'EditBlockName',          // Sidebar component name
  category: 'category-name',               // Grouping (see Categories)
  inputs: 1,                               // Input handles (0 for triggers)
  outputs: 1,                              // Output handles
  allowedInputs: true,                     // Accept incoming connections
  maxConnection: 1,                        // Max outgoing per output (99=unlimited)
  refDataKeys: ['field1', 'field2'],      // Template variable support
  autocomplete: ['varName'],               // Autocomplete dropdowns
  data: {                                  // Default schema
    disableBlock: false,                   // Standard (allow disable)
    description: '',                       // Standard (description)
    customField: 'defaultValue',           // Custom fields here
  },
}
```

### Search Keywords (searchKeywords)
The `searchKeywords` field improves block discoverability by allowing users to find blocks using related terms, not just the exact block name.

**Usage:**
- Space-separated lowercase keywords
- Include synonyms, common terms, and related concepts
- Think about what users might search for when looking for this functionality

**Example:**
```javascript
'execuxion-user-details': {
  name: 'User Details',
  description: 'Get detailed Twitter user information',
  searchKeywords: 'twitter x profile account bio followers following verified user details information',
  // ... rest of config
}
```

**Search Logic:**
The sidebar search (in `WorkflowDetailsCard.vue`) matches against three fields:
1. `block.name` - The display name
2. `block.description` - The description
3. `block.searchKeywords` - Custom search keywords

This means a block with `searchKeywords: 'twitter x profile'` will appear when users search for:
- "twitter" → matches searchKeywords
- "x" → matches searchKeywords
- "profile" → matches searchKeywords
- "user" → matches name
- "details" → matches name

**Best Practices:**
- Include platform names (twitter, x, facebook, etc.)
- Add action verbs (get, fetch, retrieve, send, post)
- Include common abbreviations (API, URL, etc.)
- Think about user intent ("followers", "bio", "verified")
- Keep it lowercase and simple
- Separate with spaces only (no commas needed)

### Categories
- `general`: Triggers, delays, notifications
- `interaction`: Clicks, forms, scroll
- `browser`: Tabs, windows, navigation
- `data`: Variables, tables, export
- `conditions`: Loops, branching
- `onlineServices`: APIs, webhooks
- `twitter`: Twitter operations (custom)

### Components
- `BlockBasic`: Single output
- `BlockBasicWithFallback`: Success + fallback outputs
- `BlockConditions`: Dynamic outputs
- `BlockDelay`: Special delay block
- `BlockLoopBreakpoint`: Loop termination

### Variable Substitution
- **refDataKeys**: Fields supporting `{{variables@x}}` syntax
- **autocomplete**: Fields with variable picker dropdown
- Template engine auto-replaces during execution

## Handler Implementation

### File: `src/workflowEngine/blocksHandler/handler[BlockName].js`

```javascript
async function blockName({ data, id }, { refData, prevBlockData, prevBlock }) {
  // Implementation
}
export default blockName;
```

**Parameters:**
- `data`: Block config (from shared.js)
- `id`: Block instance ID
- `refData`: Context (variables, table, loopData, etc.)
- `prevBlockData`: Previous block output
- `prevBlock`: Previous block metadata

**Context (this):**
- `this.engine`: WorkflowEngine instance
- `this.activeTab`: Current tab info
- `this.getBlockConnections(id, outputIndex)`: Next blocks
- `this.setVariable(name, value)`: Save to variables
- `this.addDataToColumn(columnId, value)`: Save to table
- `this._sendMessageToTab(payload)`: Message content script

### Return Formats

**Single Path:**
```javascript
return {
  data: resultData,
  nextBlockId: this.getBlockConnections(id),
  replacedValue: { field: 'orig→replaced' },  // Optional tracking
};
```

**Fallback Path:**
```javascript
return {
  data: '',
  nextBlockId: this.getBlockConnections(id, 'fallback'),
  ctxData: { /* debug info */ },  // Stored in logs
};
```

**Conditional:**
```javascript
return {
  data: result,
  nextBlockId: this.getBlockConnections(id, conditionMet ? 1 : 'fallback'),
};
```

### Auto-Registration
Vite glob import in `blocksHandler.js`:
```javascript
const blocksHandler = import.meta.glob('./blocksHandler/handler*.js', { eager: true });
```
**Naming**: `handler[BlockName].js` (camelCase) → Auto-mapped to block ID via `toCamelCase()`
Example: `twitter-like` → `handlerTwitterLike.js` → imported as `twitterLike`

## Edit Component

### File: `src/components/newtab/workflow/edit/Edit[BlockName].vue`

```vue
<template>
  <div class="mb-2 mt-4">
    <ui-textarea :model-value="data.description" @change="updateData({ description: $event })" />

    <edit-autocomplete class="mb-2">
      <ui-input
        :model-value="data.field"
        label="Label*"
        required
        @change="updateData({ field: $event })"
      />
    </edit-autocomplete>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const props = defineProps({ data: { type: Object, default: () => ({}) } });
const emit = defineEmits(['update:data']);
const { t } = useI18n();
function updateData(value) { emit('update:data', { ...props.data, ...value }); }
</script>
```

**Components:**
- `ui-input`, `ui-textarea`, `ui-select`, `ui-checkbox`
- `ui-tabs` + `ui-tab-panels`
- `edit-autocomplete`: Wrapper for variable picker
- `insert-workflow-data`: Field mapping modal

**Workflow Context:**
```javascript
import { inject } from 'vue';
const workflow = inject('workflow', {});
workflow.columns.value  // Table columns
workflow.variables      // Variables
```

**Reactivity**: Always use `updateData()`, never mutate `props.data` directly.

## Internationalization (blocks.json)

```json
{
  "workflow": {
    "blocks": {
      "block-id": {
        "name": "Display Name",
        "description": "Purpose",
        "fieldName": "Field label",
        "fallback": "Fallback description"
      }
    }
  }
}
```

**Usage**: `t('workflow.blocks.block-id.name')` or `t('common.description')`
**Fallback**: Uses `name` from shared.js if translation missing

## Data Flow & Context

### refData Structure
```javascript
refData = {
  variables: {},        // User variables ($$prefix=persistent)
  table: [],           // Workflow table
  loopData: {},        // Loop iteration data
  globalData: {},      // Global workflow data
  workflow: {},        // Child workflow data
  googleSheets: {},    // Sheets reference
  secrets: {},         // Encrypted credentials
  prevBlockData: any,  // Previous block output
  activeTabUrl: string // Current tab URL
}
```

### Setting Variables
```javascript
await this.setVariable('tempVar', value);            // Temporary ({{variables@tempVar}})
await this.setVariable('$$globalVar', value);        // Persistent (IndexedDB)
await this.setVariable('$push:arrayVar', newItem);   // Array append
```

### Writing to Table
```javascript
this.addDataToColumn('columnName', value);                        // Single
this.addDataToColumn([{ col1: val1 }, { col2: val2 }]);         // Multiple
```

**Type Conversion**: Auto-converts based on column type (any/number/string/boolean)

## Variable Substitution

**Syntax**: `{{variables@name}}`, `{{loopData@users.data.name}}`, `{{table@0.email}}`

**Auto-Processing**: Fields in `refDataKeys` processed by template engine before handler receives them

**Manual Processing**:
```javascript
import renderString from '../templating/renderString';
const rendered = await renderString(data.field, refData, this.engine.isPopup);
const value = rendered.value;         // Substituted
const substitutions = rendered.list;  // Tracking map
```

**JS Evaluation**: Prefix with `!!` → `!!new Date().toISOString()`, `!!variables.count + 1`

**Tracking**: Return `replacedValue: { field: 'orig→sub' }` to log substitutions

## Error Handling

**Simple Error**: `throw new Error('Username required');`

**Error + Context**:
```javascript
const error = new Error('API failed');
error.ctxData = { ctxData: { response: fullResponse, statusCode: 404 } };
throw error;
```

**Error + Data**: `error.data = { username: 'attempted' }; throw error;`

**Fallback Connection**:
```javascript
const fallbackOutput = this.getBlockConnections(id, 'fallback');
if (!response.ok) {
  return { data: '', nextBlockId: fallbackOutput, ctxData: { /* error */ } };
}
```

**Component**: Must be `BlockBasicWithFallback` for fallback handle

**Auto-Handling**: WorkflowWorker handles retry/continue/fallback/throw based on block config. Don't implement these.

**Best Practices**:
- Pass through original API errors (don't rephrase)
- Provide specific validation errors
- Include actionable info
- Don't log manually (auto-logged)

## Connection Types

**Single Output**: `this.getBlockConnections(id)` → Returns output-1 blocks

**Multiple Outputs**: `this.getBlockConnections(id, 1)` (first), `this.getBlockConnections(id, 2)` (second)

**Fallback**: `this.getBlockConnections(id, 'fallback')`

**Conditional**: `this.getBlockConnections(id, conditionMet ? 1 : 'fallback')`

**Dynamic**: Condition blocks create outputs based on config (see `handlerConditions.js`)

**Handle Positioning** (in component template):
```vue
<Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
<Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
<Handle :id="`${id}-output-fallback`" type="source" :position="Position.Right" style="top: auto; bottom: 10px" />
```

## Logging System

**Automatic Logging**: WorkflowEngine logs start/end, duration, status, data, substitutions, context
**Never**: Call `console.log()` or `this.engine.addLogHistory()` manually

**Log Levels**: Success (normal return), Error (exception), Finish (last block)

**Always Logged**: Block ID, name, description, timestamp, duration, worker ID, tab URL

**Conditional**: `prevBlockData`, `replacedValue`, `ctxData`, full `refData` snapshot (for blocks with `refDataKeys`)

**Storage**: IndexedDB via WorkflowLogger
- `dbLogs.items`: Summary
- `dbLogs.histories`: Execution sequence
- `dbLogs.ctxData`: Context data
- `dbLogs.logsData`: Variables/table snapshots

**Execution Summary**: Last 100 executions in `browser.storage.local` (key: `executionHistory`)

## Stop Mechanism

**Flow**:
1. User clicks stop → `WorkflowState.stop(id)` sets `isDestroyed: true`
2. `WorkflowWorker.executeBlock()` checks `isDestroyed` **before** next block
3. Current block finishes naturally (cannot interrupt)
4. `WorkflowEngine.destroy()` cleanup

**Handler Action**: NOTHING. Stop checking in WorkflowWorker, not handlers.

**Don't**:
- Check `this.engine.isDestroyed` in handlers
- Implement custom stop logic
- Use `AbortController` except for HTTP timeouts

**Long Operations**:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), data.timeout);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeoutId);
```

**Cleanup**: Auto in `WorkflowEngine.destroy()` (debuggers, proxy, logs, state, badge). Handlers don't need cleanup.

## Common Patterns

### API Request Block
```javascript
async function apiBlock({ data, id }, { refData }) {
  const nextBlockId = this.getBlockConnections(id);
  const fallbackOutput = this.getBlockConnections(id, 'fallback');

  if (!data.apiKey) throw new Error('API key required');

  const username = (await renderString(data.username, refData)).value;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), data.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${data.apiKey}` },
      body: JSON.stringify({ username }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      if (fallbackOutput) return { data: '', nextBlockId: fallbackOutput, ctxData: { ctxData: { response: errorData } } };
      throw new Error(errorData.message);
    }

    const result = await response.json();
    await this.setVariable(data.variableName, result);
    return { data: result, nextBlockId };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
```

### Loop-Compatible Block
```javascript
async function loopBlock({ data, id }, { refData }) {
  const loopData = refData.loopData[data.loopId];
  const currentItem = loopData?.data;        // Current item
  const currentIndex = loopData?.$index;     // Current index

  const result = processItem(currentItem);
  this.addDataToColumn('resultColumn', result);

  return { data: result, nextBlockId: this.getBlockConnections(id) };
}
```

### Conditional Block
```javascript
async function conditionBlock({ data, id }, { refData, prevBlockData }) {
  const conditionMet = prevBlockData > 100;
  const outputId = conditionMet ? 1 : 'fallback';
  return { data: prevBlockData, nextBlockId: this.getBlockConnections(id, outputId) };
}
```

### Field Mapping Block
```javascript
async function fieldMappingBlock({ data, id }, { refData }) {
  const apiResult = await fetchData();

  for (const mapping of data.fieldMappings.filter(m => m.enabled)) {
    const fieldValue = apiResult[mapping.field];
    if (mapping.type === 'variable') {
      await this.setVariable(mapping.name, fieldValue);
    } else {
      this.addDataToColumn(mapping.name, fieldValue);
    }
  }

  return { data: apiResult, nextBlockId: this.getBlockConnections(id) };
}
```

### Browser Interaction Block
```javascript
async function browserBlock({ data, id }) {
  const result = await this._sendMessageToTab({
    label: 'click-element',
    data: { selector: data.selector, waitForSelector: data.waitForSelector }
  });
  return { data: result, nextBlockId: this.getBlockConnections(id) };
}
```

## Troubleshooting

**Block not in UI**: Check block ID in shared.js matches pattern, category exists, component valid, no syntax errors

**Edit component blank**: Check `editComponent` matches filename `Edit[Name].vue`, file in correct dir, has props/emit, no console errors

**Variables not substituting**: Field in `refDataKeys`, syntax correct `{{variables@x}}`, variable exists, uses `edit-autocomplete`

**Handler not executing**: File named `handler[Name].js`, exports default, no syntax errors, check console

**Fallback not working**: Component is `BlockBasicWithFallback`, returns `getBlockConnections(id, 'fallback')`, connection exists, error thrown

**Data not saving**: Use `await this.setVariable()`, use `this.addDataToColumn()`, column exists, no errors before save

**Logging missing**: Return `replacedValue` for tracking, return `ctxData` for debug, fields in `refDataKeys`, workflow.saveLog=true

**Stop not working**: Handler blocking event loop with sync code. Use `await` for async ops, no blocking loops

**Timeout not respected**: Use `AbortController` + `signal`, timeout in ms not seconds, call abort in setTimeout, clear timeout on success/error

## Implementation Checklist

- [ ] Block definition in `src/utils/shared.js`
- [ ] Add `searchKeywords` field with relevant search terms
- [ ] Handler in `src/workflowEngine/blocksHandler/handler[Name].js`
- [ ] Export default function from handler
- [ ] Edit component in `src/components/newtab/workflow/edit/Edit[Name].vue`
- [ ] Translations in `src/locales/en/blocks.json`
- [ ] Correct component type (`BlockBasic` vs `BlockBasicWithFallback`)
- [ ] `refDataKeys` for variable substitution
- [ ] Return `{ data, nextBlockId }` from handler
- [ ] Use `this.setVariable()` and `this.addDataToColumn()`
- [ ] Don't implement logging (automatic)
- [ ] Don't check `isDestroyed` (automatic)
- [ ] Test: empty inputs, invalid data, timeouts
- [ ] Verify fallback path (if applicable)
- [ ] Check variable substitution in edit component
- [ ] Clear, actionable error messages
- [ ] Test search functionality with various keywords

## Critical Facts

- Blocks execute sequentially (WorkflowWorker handles one at a time per worker)
- Stop happens between blocks (cannot interrupt mid-execution)
- Logging is automatic (never log manually)
- Errors propagate (WorkflowEngine handles display/logging)
- Data flows forward (each block receives previous output)
- Context is shared (variables/table persist across all blocks)
- Templating is powerful (support `{{}}` in all user-facing text)
- Consistent behavior across all block types
