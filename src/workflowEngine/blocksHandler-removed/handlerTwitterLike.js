import objectPath from 'object-path';
import { isWhitespace } from '@/utils/helper';
import renderString from '../templating/renderString';

const EXECUXION_API_BASE = 'http://localhost:3000/twitter/v2'; // Your API endpoint

export async function twitterLike({ data, id }, { refData }) {
  const nextBlockId = this.getBlockConnections(id);

  try {
    // Validate required fields
    if (isWhitespace(data.tweetId)) throw new Error('tweet-id-empty');
    if (isWhitespace(data.authCookies)) throw new Error('auth-cookies-empty');
    if (isWhitespace(data.apiKey)) throw new Error('api-key-empty');

    // Render template variables
    const tweetId = (await renderString(data.tweetId, refData, this.engine.isPopup)).value;
    const authCookies = (await renderString(data.authCookies, refData, this.engine.isPopup)).value;
    const apiKey = (await renderString(data.apiKey, refData, this.engine.isPopup)).value;
    const proxy = data.proxy ? (await renderString(data.proxy, refData, this.engine.isPopup)).value : '';

    // Prepare request body for Execuxion API
    const requestBody = {
      op: 'tweet.like',
      args: {
        tweet_id: tweetId,
        x_auth: authCookies,
        ...(proxy && { proxy })
      }
    };

    // Make request to Execuxion API
    const response = await fetch(EXECUXION_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-client-id': 'automa-webapp'
      },
      body: JSON.stringify(requestBody),
      signal: data.timeout > 0 ? AbortSignal.timeout(data.timeout) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Twitter API Error (${response.status}): ${errorData.message || response.statusText}`);
      error.data = { status: response.status, response: errorData };
      throw error;
    }

    const responseData = await response.json();

    // Handle successful response
    let result = responseData;

    // If dataPath is specified, extract nested data
    if (data.dataPath) {
      const path = (await renderString(data.dataPath, refData, this.engine.isPopup)).value;
      result = objectPath.get(responseData, path, responseData);
    }

    const ctxData = { ctxData: { request: responseData } };

    // Save to variable if specified
    if (data.assignVariable) {
      const variableName = (await renderString(data.variableName, refData, this.engine.isPopup)).value;
      if (variableName) {
        await this.addVariable(variableName, result);
      }
    }

    // Save to table if specified
    if (data.saveData && data.dataColumn) {
      const columnName = (await renderString(data.dataColumn, refData, this.engine.isPopup)).value;
      await this.addDataToColumn(columnName, result);
    }

    return {
      data: result,
      nextBlockId,
      ctxData,
    };

  } catch (error) {
    error.nextBlockId = nextBlockId;
    throw error;
  }
}

export default twitterLike;