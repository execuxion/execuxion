import { isWhitespace } from '@/utils/helper';
import AuthService from '@/service/AuthService';
import renderString from '../templating/renderString';

/**
 * Execute Execuxion API user.details operation
 * Gets detailed Twitter user information with field-by-field extraction
 *
 * API Endpoint: POST /twitter/v2 with op=user.details
 * Cost: 3 credits per request
 *
 * @param {Object} block - Block configuration with fieldMappings
 * @param {Object} context - Execution context with refData
 * @returns {Promise<{nextBlockId, data, replacedValue?}>}
 */
export async function execuxionUserDetails({ data, id }, { refData }) {
  const nextBlockId = this.getBlockConnections(id);

  try {
    // === VALIDATION ===
    if (isWhitespace(data.username)) {
      throw new Error('Twitter username is required');
    }

    // Check authentication
    if (!AuthService.isLoggedIn()) {
      const error = new Error('Not authenticated. Please login with your Execuxion API key.');
      error.code = 'EXECUXION_NOT_AUTHENTICATED';
      throw error;
    }

    const apiKey = AuthService.getApiKey();
    if (!apiKey || !apiKey.startsWith('ex_')) {
      const error = new Error('Invalid API key format. Expected ex_ prefixed key.');
      error.code = 'EXECUXION_INVALID_API_KEY';
      throw error;
    }

    // Render username (support {{variables}})
    const renderedUsername = (await renderString(data.username, refData, this.engine.isPopup)).value;
    const cleanUsername = renderedUsername.replace('@', '').trim();

    if (isWhitespace(cleanUsername)) {
      throw new Error('Username cannot be empty after variable substitution');
    }

    // === HTTP REQUEST ===
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.execuxion.com';
    let timeoutId = null;
    let controller = null;

    if (data.timeout > 0) {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
      }, data.timeout);
    }

    try {
      const requestBody = {
        op: 'user.details',
        args: {
          username: cleanUsername
        }
      };

      const response = await fetch(`${apiUrl}/twitter/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller?.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      // === RESPONSE HANDLING ===
      const responseData = await response.json();

      // Check for API-level errors (ok: false)
      if (!response.ok || !responseData.ok) {
        // Extract error message from API response
        const apiErrorMessage = responseData.data?.message ||
                                responseData.error?.message ||
                                responseData.message ||
                                'API request failed';

        // Store full response in logs for debugging
        const ctxData = {
          ctxData: {
            execuxion: {
              response: responseData,  // Full original API response
              status: response.status,
              statusText: response.statusText,
              operation: 'user.details',
              username: cleanUsername
            },
          },
        };

        // Show extracted message to user, full response in logs
        const error = new Error(apiErrorMessage);
        error.ctxData = ctxData;
        throw error;
      }

      // === SUCCESS - PROCESS USER DATA ===
      const userData = responseData.data;

      if (!userData) {
        throw new Error('API returned success but no user data');
      }

      // Track replaced values for logging
      const replacedValueList = {};

      // === SAVE FULL OBJECT (if requested) ===
      if (data.saveFullObject) {
        if (data.fullObjectType === 'variable' && data.fullObjectVariable) {
          await this.setVariable(data.fullObjectVariable, userData);
        } else if (data.fullObjectType === 'table' && data.fullObjectColumn) {
          this.addDataToColumn(data.fullObjectColumn, userData);
        }
      }

      // === PROCESS FIELD MAPPINGS ===
      const fieldMappings = data.fieldMappings || [];
      const enabledMappings = fieldMappings.filter(m => m.enabled && m.name);

      // Build object with ONLY selected fields
      const extractedData = {};

      for (const mapping of enabledMappings) {
        const fieldValue = userData[mapping.field];

        // Skip if field doesn't exist in response
        if (fieldValue === undefined || fieldValue === null) {
          continue;
        }

        // Render the name (support {{variables}})
        const renderedName = await renderString(
          mapping.name,
          refData,
          this.engine.isPopup
        );
        const finalName = renderedName.value;

        if (mapping.type === 'variable') {
          // Save to variable
          await this.setVariable(finalName, fieldValue);
        } else if (mapping.type === 'table') {
          // Save to table column
          const values = typeof fieldValue === 'string' ? fieldValue.split('||') : [fieldValue];
          values.forEach((value) => {
            this.addDataToColumn(finalName, value);
          });
        }

        // Add to extracted data object (only selected fields)
        extractedData[mapping.field] = fieldValue;

        // Track for logging
        Object.assign(replacedValueList, renderedName.list);
      }

      // Return ONLY extracted fields, not full userData
      return {
        nextBlockId,
        data: extractedData,
        replacedValue: replacedValueList,
      };

    } catch (fetchError) {
      if (timeoutId) clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    // Attach next block ID for error propagation
    error.nextBlockId = nextBlockId;
    throw error;
  }
}

export default execuxionUserDetails;
