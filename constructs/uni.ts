import { Construct, CustomResource, Duration } from "@aws-cdk/core";
import { Provider } from "@aws-cdk/custom-resources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Architecture, Runtime } from "@aws-cdk/aws-lambda";
import * as path from "path";
import { ISecret } from "@aws-cdk/aws-secretsmanager";

interface UniProps {
  apiUrl: string;
  apiKey: ISecret;
  schema: string;
  deadLetterWebhooks?: string;
}

export class Uni extends Construct {
  constructor(scope: Construct, id: string, props: UniProps) {
    super(scope, id);

    const onEventHandler = new NodejsFunction(this, "UniEventHandler", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_14_X,
      entry: path.resolve(__dirname, "./lambda/uni-event-handler.ts"),
      timeout: Duration.minutes(1),
      environment: {
        API_KEY: props.apiKey.secretValue.toString(),
      },
    });

    const provider = new Provider(this, "Provider", {
      onEventHandler,
    });

    new CustomResource(this, "UniCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        apiUrl: props.apiUrl,
        schema: props.schema,
        deadLetterWebhooks: props.deadLetterWebhooks,
      },
    });
  }
}
