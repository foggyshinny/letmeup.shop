/**
 * letmeup.shop DynamoDB 테이블 생성 스크립트.
 *
 * 단일 테이블 + GSI("gsi1") 구조를 생성합니다. (lib/dynamo.ts 스키마와 일치)
 *
 * 사용법:
 *   # 실제 AWS (자격증명/리전은 환경 또는 aws configure 로 설정)
 *   DYNAMODB_TABLE=letmeup AWS_REGION=ap-northeast-2 node scripts/create-dynamodb-table.mjs
 *
 *   # 로컬 DynamoDB Local 테스트
 *   DYNAMODB_TABLE=letmeup DYNAMODB_ENDPOINT=http://localhost:8000 \
 *     AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy \
 *     node scripts/create-dynamodb-table.mjs
 */
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

const TableName = process.env.DYNAMODB_TABLE || "letmeup";
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

try {
  await client.send(
    new CreateTableCommand({
      TableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
        { AttributeName: "gsi1pk", AttributeType: "S" },
        { AttributeName: "gsi1sk", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "gsi1pk", KeyType: "HASH" },
            { AttributeName: "gsi1sk", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    }),
  );
  console.log(`✅ 테이블 "${TableName}" 생성 요청 완료`);
} catch (e) {
  if (e.name === "ResourceInUseException") {
    console.log(`ℹ️  테이블 "${TableName}" 이(가) 이미 존재합니다.`);
  } else {
    throw e;
  }
}

const d = await client.send(new DescribeTableCommand({ TableName }));
console.log(
  `상태: ${d.Table.TableStatus} · GSI: ${d.Table.GlobalSecondaryIndexes?.map((g) => g.IndexName).join(", ")}`,
);
