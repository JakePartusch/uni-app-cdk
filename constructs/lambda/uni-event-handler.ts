import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse,
  Context,
} from "aws-lambda";
import { request } from "graphql-request";
export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
): Promise<CloudFormationCustomResourceResponse> => {
  console.log(JSON.stringify(event, null, 2));
  const { RequestId, StackId, LogicalResourceId, ResourceProperties } = event;

  const { API_KEY: apiKey } = process.env;

  const { apiUrl, schema, deadLetterWebhooks } = ResourceProperties;

  const query = `
      query uniInfoQuery {
          get_UniInfo {
              name
          }
      }
    `;

  const queryResponse = await request(apiUrl, query, undefined, {
    "x-api-key": apiKey!,
  });

  const mutation = `
    mutation updateUni($updateUniInfoInput: _UniInfoUpdateInput!, $updateSettingsInput: _SettingsUpdateInput!) {
        update_UniInfo_async(input: $updateUniInfoInput) {
            error
            result {
                id
                node_owner
                submission_time
                tx_id
                tx_version
            }
        }
        update_Settings_async(input: $updateSettingsInput) {
            error
            result {
                id
                node_owner
                submission_time
                tx_id
                tx_version
            }
        }
    }
  `;
  const mutationResponse = await request(
    apiUrl,
    mutation,
    {
      updateUniInfoInput: {
        schema,
      },
      updateSettingsInput: {
        deadLetterWebhooks,
      },
    },
    {
      "x-api-key": apiKey!,
    }
  );

  console.log(JSON.stringify(mutationResponse, null, 2));

  return {
    PhysicalResourceId: queryResponse.get_UniInfo.name,
    RequestId,
    StackId,
    Status: "SUCCESS",
    LogicalResourceId,
  };
};
