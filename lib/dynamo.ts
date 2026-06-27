import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { StoreBackend } from "./store";
import type {
  Coupon,
  LocationRecord,
  Order,
  SavedPaymentMethod,
  Seller,
  Settlement,
  User,
} from "./types";

/**
 * DynamoDB 단일 테이블 저장소.
 *
 * 필요 환경변수:
 *   DYNAMODB_TABLE     테이블 이름 (이 값이 있으면 DynamoDB 사용)
 *   DYNAMODB_ENDPOINT  (선택) 로컬 테스트용 엔드포인트 (예: http://localhost:8000)
 *   AWS_REGION         리전 (기본: ap-northeast-2)
 *   AWS 자격증명        Amplify/Lambda에서는 IAM 역할로 자동 주입
 *
 * 테이블 스키마(단일 테이블):
 *   파티션키 pk (S), 정렬키 sk (S)
 *   GSI "gsi1": gsi1pk (S), gsi1sk (S)
 *
 * 아이템 키 설계:
 *   주문      pk=ORDER#<id>  sk=ORDER   gsi1pk=OWNER#<ownerId> gsi1sk=<createdAt>
 *   회원      pk=USER#<id>   sk=USER    gsi1pk=EMAIL#<email>   gsi1sk=USER
 *   결제수단  pk=PM#<owner>  sk=PM#<id>
 *   위치      pk=LOC#<owner> sk=LOC
 *   판매자    pk=SELLER#<id> sk=SELLER  gsi1pk=SELLEREMAIL#<email> gsi1sk=SELLER
 *   상품      pk=PRODUCT#<id> sk=PRODUCT gsi1pk=SELLER#<sellerId>  gsi1sk=<createdAt>
 *   정산      pk=SETTLE#<id>  sk=SETTLE  gsi1pk=SELLERSETTLE#<sellerId> gsi1sk=<createdAt>
 *   (도메인 객체는 data 속성에 통째로 보관)
 */

interface Item<T> {
  pk: string;
  sk: string;
  gsi1pk?: string;
  gsi1sk?: string;
  type: string;
  data: T;
}

export function createDynamoStore(): StoreBackend {
  const table = process.env.DYNAMODB_TABLE!;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION ?? "ap-northeast-2",
    ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
  });
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const put = (item: Item<unknown>) =>
    doc.send(new PutCommand({ TableName: table, Item: item }));

  return {
    // ── 주문 ──
    async saveOrder(order: Order) {
      await put({
        pk: `ORDER#${order.id}`,
        sk: "ORDER",
        gsi1pk: `OWNER#${order.ownerId}`,
        gsi1sk: order.createdAt,
        type: "order",
        data: order,
      });
      return order;
    },
    async getOrder(id: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `ORDER#${id}`, sk: "ORDER" } }),
      );
      return (r.Item as Item<Order> | undefined)?.data;
    },
    async updateOrder(id: string, patch: Partial<Order>) {
      const cur = await this.getOrder(id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch };
      await this.saveOrder(next);
      return next;
    },
    async listOrdersByOwner(ownerId: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :p",
          ExpressionAttributeValues: { ":p": `OWNER#${ownerId}` },
          ScanIndexForward: false, // 최신순
        }),
      );
      return (r.Items as Item<Order>[] | undefined)?.map((i) => i.data) ?? [];
    },
    async listAllOrders() {
      const r = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":t": "order" },
        }),
      );
      return (
        (r.Items as Item<Order>[] | undefined)
          ?.map((i) => i.data)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? []
      );
    },

    // ── 회원 ──
    async countUsers() {
      const r = await doc.send(
        new ScanCommand({
          TableName: table,
          Select: "COUNT",
          FilterExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":t": "user" },
        }),
      );
      return r.Count ?? 0;
    },
    async createUser(user: User) {
      await put({
        pk: `USER#${user.id}`,
        sk: "USER",
        gsi1pk: `EMAIL#${user.email.toLowerCase()}`,
        gsi1sk: "USER",
        type: "user",
        data: user,
      });
      return user;
    },
    async getUser(id: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `USER#${id}`, sk: "USER" } }),
      );
      return (r.Item as Item<User> | undefined)?.data;
    },
    async getUserByEmail(email: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :p",
          ExpressionAttributeValues: { ":p": `EMAIL#${email.toLowerCase()}` },
          Limit: 1,
        }),
      );
      return (r.Items as Item<User>[] | undefined)?.[0]?.data;
    },

    // ── 결제수단 ──
    async listPaymentMethods(owner: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: "pk = :p AND begins_with(sk, :s)",
          ExpressionAttributeValues: { ":p": `PM#${owner}`, ":s": "PM#" },
        }),
      );
      return (r.Items as Item<SavedPaymentMethod>[] | undefined)?.map((i) => i.data) ?? [];
    },
    async addPaymentMethod(owner: string, pm: SavedPaymentMethod) {
      const existing = await this.listPaymentMethods(owner);
      if (existing.length === 0) pm.isDefault = true;
      await put({ pk: `PM#${owner}`, sk: `PM#${pm.id}`, type: "pm", data: pm });
      return pm;
    },
    async removePaymentMethod(owner: string, id: string) {
      const list = await this.listPaymentMethods(owner);
      if (!list.some((p) => p.id === id)) return false;
      await doc.send(
        new DeleteCommand({ TableName: table, Key: { pk: `PM#${owner}`, sk: `PM#${id}` } }),
      );
      // 기본 결제수단을 지웠다면 남은 것 중 첫 번째를 기본으로
      const remaining = list.filter((p) => p.id !== id);
      if (remaining.length > 0 && !remaining.some((p) => p.isDefault)) {
        remaining[0].isDefault = true;
        await put({
          pk: `PM#${owner}`,
          sk: `PM#${remaining[0].id}`,
          type: "pm",
          data: remaining[0],
        });
      }
      return true;
    },
    async setDefaultPaymentMethod(owner: string, id: string) {
      const list = await this.listPaymentMethods(owner);
      if (!list.some((p) => p.id === id)) return false;
      await Promise.all(
        list.map((p) => {
          p.isDefault = p.id === id;
          return put({ pk: `PM#${owner}`, sk: `PM#${p.id}`, type: "pm", data: p });
        }),
      );
      return true;
    },
    async getPaymentMethod(owner: string, id: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `PM#${owner}`, sk: `PM#${id}` } }),
      );
      return (r.Item as Item<SavedPaymentMethod> | undefined)?.data;
    },

    // ── 위치 ──
    async saveLocation(owner: string, rec: LocationRecord) {
      await put({ pk: `LOC#${owner}`, sk: "LOC", type: "location", data: rec });
      return rec;
    },
    async getLocation(owner: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `LOC#${owner}`, sk: "LOC" } }),
      );
      return (r.Item as Item<LocationRecord> | undefined)?.data;
    },

    // ── 판매자 ──
    async createSeller(seller: Seller) {
      await put({
        pk: `SELLER#${seller.id}`,
        sk: "SELLER",
        gsi1pk: `SELLEREMAIL#${seller.email.toLowerCase()}`,
        gsi1sk: "SELLER",
        type: "seller",
        data: seller,
      });
      return seller;
    },
    async getSeller(id: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `SELLER#${id}`, sk: "SELLER" } }),
      );
      return (r.Item as Item<Seller> | undefined)?.data;
    },
    async getSellerByEmail(email: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :p",
          ExpressionAttributeValues: { ":p": `SELLEREMAIL#${email.toLowerCase()}` },
          Limit: 1,
        }),
      );
      return (r.Items as Item<Seller>[] | undefined)?.[0]?.data;
    },
    async updateSeller(id: string, patch: Partial<Seller>) {
      const cur = await this.getSeller(id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch };
      await this.createSeller(next);
      return next;
    },
    async listSellers() {
      const r = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":t": "seller" },
        }),
      );
      return (
        (r.Items as Item<Seller>[] | undefined)
          ?.map((i) => i.data)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? []
      );
    },

    // ── 판매자 상품 ──
    async saveProduct(product: Coupon) {
      await put({
        pk: `PRODUCT#${product.id}`,
        sk: "PRODUCT",
        gsi1pk: `SELLER#${product.sellerId ?? "PLATFORM"}`,
        gsi1sk: product.createdAt ?? new Date().toISOString(),
        type: "product",
        data: product,
      });
      return product;
    },
    async getProduct(id: string) {
      const r = await doc.send(
        new GetCommand({ TableName: table, Key: { pk: `PRODUCT#${id}`, sk: "PRODUCT" } }),
      );
      return (r.Item as Item<Coupon> | undefined)?.data;
    },
    async updateProduct(id: string, patch: Partial<Coupon>) {
      const cur = await this.getProduct(id);
      if (!cur) return undefined;
      const next = { ...cur, ...patch };
      await this.saveProduct(next);
      return next;
    },
    async deleteProduct(id: string) {
      const cur = await this.getProduct(id);
      if (!cur) return false;
      await doc.send(
        new DeleteCommand({ TableName: table, Key: { pk: `PRODUCT#${id}`, sk: "PRODUCT" } }),
      );
      return true;
    },
    async listProductsBySeller(sellerId: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :p",
          ExpressionAttributeValues: { ":p": `SELLER#${sellerId}` },
          ScanIndexForward: false,
        }),
      );
      return (r.Items as Item<Coupon>[] | undefined)?.map((i) => i.data) ?? [];
    },
    async listAllProducts() {
      const r = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":t": "product" },
        }),
      );
      return (
        (r.Items as Item<Coupon>[] | undefined)
          ?.map((i) => i.data)
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) ?? []
      );
    },

    // ── 정산 ──
    async saveSettlement(settlement: Settlement) {
      await put({
        pk: `SETTLE#${settlement.id}`,
        sk: "SETTLE",
        gsi1pk: `SELLERSETTLE#${settlement.sellerId}`,
        gsi1sk: settlement.createdAt,
        type: "settlement",
        data: settlement,
      });
      return settlement;
    },
    async listSettlementsBySeller(sellerId: string) {
      const r = await doc.send(
        new QueryCommand({
          TableName: table,
          IndexName: "gsi1",
          KeyConditionExpression: "gsi1pk = :p",
          ExpressionAttributeValues: { ":p": `SELLERSETTLE#${sellerId}` },
          ScanIndexForward: false,
        }),
      );
      return (r.Items as Item<Settlement>[] | undefined)?.map((i) => i.data) ?? [];
    },
    async listAllSettlements() {
      const r = await doc.send(
        new ScanCommand({
          TableName: table,
          FilterExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": "type" },
          ExpressionAttributeValues: { ":t": "settlement" },
        }),
      );
      return (
        (r.Items as Item<Settlement>[] | undefined)
          ?.map((i) => i.data)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? []
      );
    },
  };
}
