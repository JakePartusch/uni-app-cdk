import { Construct, Duration, Stack, StackProps } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Architecture, Runtime } from "@aws-cdk/aws-lambda";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { Secret } from "@aws-cdk/aws-secretsmanager";
import * as fs from "fs";
import * as path from "path";
import { Uni } from "../constructs/uni";

export class UniAppCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const deadLetterHandler = new NodejsFunction(this, "UniDeadLetterHandler", {
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_14_X,
      entry: path.resolve(__dirname, "../lambda/dead-letter-handler.ts"),
      timeout: Duration.seconds(30),
    });

    const webhookIntegration = new LambdaProxyIntegration({
      handler: deadLetterHandler,
    });

    const httpApi = new HttpApi(this, "HttpApi");

    httpApi.addRoutes({
      path: "/",
      integration: webhookIntegration,
    });

    const schema = JSON.stringify(
      JSON.parse(
        fs
          .readFileSync(path.resolve(__dirname, "../schema/schema.json"))
          .toString("ascii")
      )
    );

    const apiKey = Secret.fromSecretAttributes(this, "UniApiKey", {
      secretCompleteArn:
        "arn:aws:secretsmanager:us-west-2:857786057494:secret:uni-api-key-RxE45G",
    });

    new Uni(this, "Uni", {
      apiUrl: "https://k099n3eqnc.execute-api.us-east-2.amazonaws.com/graphql",
      apiKey,
      schema,
      deadLetterWebhooks: httpApi.url,
    });
  }
}
