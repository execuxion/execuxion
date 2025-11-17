<template>
  <div>
    <!-- Description -->
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full mb-4"
      @change="updateData({ description: $event })"
    />

    <!-- Username Input -->
    <edit-autocomplete class="mb-2">
      <ui-input
        :model-value="data.username"
        :label="t('workflow.blocks.execuxion-user-details.username.label') + '*'"
        :placeholder="t('workflow.blocks.execuxion-user-details.username.placeholder')"
        class="w-full"
        autocomplete="off"
        required
        @change="updateData({ username: $event })"
      />
    </edit-autocomplete>

    <!-- Timeout -->
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.execuxion-user-details.timeout.label')"
      :title="t('workflow.blocks.execuxion-user-details.timeout.title')"
      class="mb-4 w-full"
      type="number"
      @change="updateData({ timeout: +$event })"
    />

    <!-- Field Mapping Button -->
    <ui-button
      class="mb-2 w-full"
      variant="accent"
      @click="showFieldModal = !showFieldModal"
    >
      {{ t('workflow.blocks.execuxion-user-details.selectFields') }} ({{ fieldMappings.length }})
    </ui-button>

    <!-- Full Object Option -->
    <ui-checkbox
      :model-value="data.saveFullObject"
      class="mt-4"
      @change="updateData({ saveFullObject: $event })"
    >
      {{ t('workflow.blocks.execuxion-user-details.saveFullObject') }}
    </ui-checkbox>

    <template v-if="data.saveFullObject">
      <ui-select
        :model-value="data.fullObjectType"
        class="mt-2 w-full"
        @change="updateData({ fullObjectType: $event })"
      >
        <option value="variable">{{ t('workflow.variables.title') }}</option>
        <option value="table">{{ t('workflow.table.title') }}</option>
      </ui-select>

      <ui-input
        v-if="data.fullObjectType === 'variable'"
        :model-value="data.fullObjectVariable"
        :placeholder="t('workflow.variables.name')"
        class="mt-2 w-full"
        @change="updateData({ fullObjectVariable: $event })"
      />

      <ui-select
        v-else
        :model-value="data.fullObjectColumn"
        :placeholder="t('workflow.table.select')"
        class="mt-2 w-full"
        @change="updateData({ fullObjectColumn: $event })"
      >
        <option
          v-for="column in workflow.columns.value"
          :key="column.id"
          :value="column.id"
        >
          {{ column.name }}
        </option>
      </ui-select>
    </template>

    <!-- Field Mapping Modal -->
    <ui-modal
      v-model="showFieldModal"
      :title="t('workflow.blocks.execuxion-user-details.fieldModal.title')"
      padding="p-0"
      content-class="max-w-3xl execuxion-user-details-modal"
    >
      <ul
        class="data-list scroll mt-4 overflow-auto px-4 pb-4"
        style="max-height: calc(100vh - 13rem - var(--titlebar-height))"
      >
        <li
          v-for="(mapping, index) in fieldMappings"
          :key="index"
          class="mb-4 rounded-lg border"
        >
          <!-- Field Header -->
          <div class="flex items-center border-b p-2">
            <ui-checkbox
              :model-value="mapping.enabled"
              @change="toggleField(index, $event)"
            >
              <span class="font-medium">{{ mapping.label }}</span>
            </ui-checkbox>
            <div class="grow" />
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ mapping.field }}
            </span>
          </div>

          <!-- Field Configuration (when enabled) -->
          <div v-if="mapping.enabled" class="p-2">
            <div class="flex items-center gap-2 mb-2">
              <ui-select
                :model-value="mapping.type"
                class="flex-1"
                @change="changeFieldType(index, $event)"
              >
                <option value="variable">{{ t('workflow.variables.title') }}</option>
                <option value="table">{{ t('workflow.table.title') }}</option>
              </ui-select>

              <ui-input
                v-if="mapping.type === 'variable'"
                v-model="mapping.name"
                :placeholder="t('workflow.variables.name')"
                class="flex-1"
              />
              <ui-select
                v-else
                v-model="mapping.name"
                :placeholder="t('workflow.table.select')"
                class="flex-1"
              >
                <option
                  v-for="column in workflow.columns.value"
                  :key="column.id"
                  :value="column.id"
                >
                  {{ column.name }}
                </option>
              </ui-select>

              <v-remixicon
                name="riDeleteBin7Line"
                class="cursor-pointer"
                @click="removeFieldMapping(index)"
              />
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ mapping.description }}
            </p>
          </div>
        </li>
      </ul>
    </ui-modal>
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import EditAutocomplete from './EditAutocomplete.vue';

// Available Twitter user fields
const TWITTER_USER_FIELDS = [
  { field: 'id', label: 'User ID', description: 'Unique Twitter user ID (e.g., "44196397")', defaultName: 'userId' },
  { field: 'username', label: 'Username', description: 'Twitter handle without @ (e.g., "elonmusk")', defaultName: 'username' },
  { field: 'name', label: 'Display Name', description: 'User\'s display name (e.g., "Elon Musk")', defaultName: 'displayName' },
  { field: 'bio', label: 'Bio / Description', description: 'User profile description', defaultName: 'bio' },
  { field: 'followers', label: 'Followers Count', description: 'Number of followers', defaultName: 'followers' },
  { field: 'following', label: 'Following Count', description: 'Number of accounts following', defaultName: 'following' },
  { field: 'tweets', label: 'Tweet Count', description: 'Total number of tweets', defaultName: 'tweetCount' },
  { field: 'likes', label: 'Likes Count', description: 'Total number of likes given', defaultName: 'likesCount' },
  { field: 'verified', label: 'Verified (Legacy)', description: 'Legacy blue checkmark status', defaultName: 'verified' },
  { field: 'verified_blue', label: 'Verified Blue', description: 'Twitter Blue verification status', defaultName: 'verifiedBlue' },
  { field: 'location', label: 'Location', description: 'User location (if provided)', defaultName: 'location' },
  { field: 'created_at', label: 'Account Created', description: 'Account creation date (ISO format)', defaultName: 'createdAt' },
  { field: 'profile_image_url', label: 'Profile Image URL', description: 'URL to profile picture', defaultName: 'profileImage' },
  { field: 'profile_banner_url', label: 'Banner Image URL', description: 'URL to profile banner', defaultName: 'bannerImage' },
  { field: 'protected', label: 'Protected Account', description: 'Whether account is private', defaultName: 'isPrivate' },
  { field: 'listed_count', label: 'Listed Count', description: 'Number of lists user appears in', defaultName: 'listedCount' },
  { field: 'pinned_tweet_id', label: 'Pinned Tweet ID', description: 'ID of pinned tweet (if any)', defaultName: 'pinnedTweetId' },
];

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();
const workflow = inject('workflow', {});

const showFieldModal = ref(false);
const fieldMappings = ref(
  JSON.parse(JSON.stringify(props.data.fieldMappings || []))
);

// Initialize field mappings if empty
if (fieldMappings.value.length === 0) {
  fieldMappings.value = TWITTER_USER_FIELDS.map(field => ({
    ...field,
    enabled: false,
    type: 'variable',
    name: field.defaultName,
  }));
}

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function toggleField(index, enabled) {
  fieldMappings.value[index].enabled = enabled;
  if (!enabled) {
    // Reset name when disabled
    fieldMappings.value[index].name = fieldMappings.value[index].defaultName;
  }
}

function changeFieldType(index, type) {
  fieldMappings.value[index].type = type;
  fieldMappings.value[index].name = type === 'variable'
    ? fieldMappings.value[index].defaultName
    : '';
}

function removeFieldMapping(index) {
  fieldMappings.value[index].enabled = false;
  fieldMappings.value[index].name = fieldMappings.value[index].defaultName;
}

// Watch for changes and update parent
watch(
  fieldMappings,
  (value) => {
    updateData({ fieldMappings: value });
  },
  { deep: true }
);
</script>
<style>
.execuxion-user-details-modal .modal-ui__content-header {
  @apply p-4;
}
</style>
