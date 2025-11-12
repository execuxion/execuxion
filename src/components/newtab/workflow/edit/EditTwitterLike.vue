<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="mb-2 w-full"
      @change="updateData({ description: $event })"
    />

    <edit-autocomplete class="mb-2">
      <ui-input
        :model-value="data.tweetId"
        :label="`Tweet ID*`"
        placeholder="1234567890123456789"
        class="w-full"
        autocomplete="off"
        required
        @change="updateData({ tweetId: $event })"
      />
    </edit-autocomplete>

    <edit-autocomplete class="mb-2">
      <ui-textarea
        :model-value="data.authCookies"
        :label="`Authentication Cookies*`"
        placeholder="ct0=...; auth_token=...; twid=..."
        class="w-full"
        rows="3"
        autocomplete="off"
        required
        @change="updateData({ authCookies: $event })"
      />
    </edit-autocomplete>

    <edit-autocomplete class="mb-2">
      <ui-input
        :model-value="data.apiKey"
        :label="`Execuxion API Key*`"
        placeholder="ek_user_..."
        class="w-full"
        autocomplete="off"
        required
        type="password"
        @change="updateData({ apiKey: $event })"
      />
    </edit-autocomplete>

    <edit-autocomplete class="mb-2">
      <ui-input
        :model-value="data.proxy"
        :label="`Proxy (Optional)`"
        placeholder="http://username:password@proxy.server.com:8080"
        class="w-full"
        autocomplete="off"
        @change="updateData({ proxy: $event })"
      />
    </edit-autocomplete>

    <ui-input
      :model-value="data.timeout"
      :label="
        'Timeout (ms)' +
        ` (0 to disable)`
      "
      title="Request timeout in milliseconds"
      class="mb-2 w-full"
      type="number"
      @change="updateData({ timeout: +$event })"
    />

    <ui-tabs v-model="activeTab" fill>
      <ui-tab value="response">
        Response Data
      </ui-tab>
    </ui-tabs>

    <ui-tab-panels v-model="activeTab">
      <ui-tab-panel value="response" class="pt-4">
        <edit-autocomplete class="mb-2">
          <ui-input
            :model-value="data.variableName"
            :label="t('workflow.blocks.webhook.response.variableName')"
            :placeholder="t('workflow.blocks.webhook.response.variableName')"
            class="w-full"
            autocomplete="off"
            @change="updateData({ variableName: $event })"
          />
        </edit-autocomplete>
        <ui-checkbox
          :model-value="data.assignVariable"
          class="mb-2"
          @change="updateData({ assignVariable: $event })"
        >
          {{ t('workflow.blocks.webhook.response.assignVariable') }}
        </ui-checkbox>
        <ui-checkbox
          :model-value="data.saveData"
          @change="updateData({ saveData: $event })"
        >
          {{ t('workflow.blocks.webhook.response.saveData') }}
        </ui-checkbox>
        <edit-autocomplete v-if="data.saveData" class="mt-2">
          <ui-input
            :model-value="data.dataColumn"
            :label="t('workflow.blocks.webhook.response.dataColumn')"
            :placeholder="t('workflow.blocks.webhook.response.dataColumn')"
            class="w-full"
            autocomplete="off"
            @change="updateData({ dataColumn: $event })"
          />
        </edit-autocomplete>
      </ui-tab-panel>
    </ui-tab-panels>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const activeTab = ref('response');

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>