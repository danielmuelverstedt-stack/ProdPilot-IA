import type { ErpPlanningProjection } from "../types/erp-import.ts";

export interface ErpArticleCluster {
  key: string;
  articleCode: string;
  workOrderIds: string[];
}

export interface ErpArticleClusterAnalysis {
  clusters: Map<string, ErpArticleCluster>;
  multiWorkOrderArticles: number;
  workOrdersInMultipleArticles: number;
}

export function analyzeErpArticleClusters(projection: ErpPlanningProjection): ErpArticleClusterAnalysis {
  const workOrderById = new Map(projection.workOrders.map((workOrder) => [workOrder.id, workOrder]));
  const workOrdersByArticle = new Map<string, Set<string>>();
  const articleCodes = new Map<string, string>();
  projection.operations.forEach((operation) => {
    const workOrder = workOrderById.get(operation.workOrderId);
    const key = normalizeErpArticleKey(workOrder?.articleId || operation.articleCode);
    if (!key) return;
    const workOrderIds = workOrdersByArticle.get(key) ?? new Set<string>();
    workOrderIds.add(operation.workOrderId);
    workOrdersByArticle.set(key, workOrderIds);
    if (!articleCodes.has(key)) articleCodes.set(key, operation.articleCode || workOrder?.articleCode || key);
  });
  const clusters = new Map([...workOrdersByArticle].map(([key, workOrderIds]) => [key, { key, articleCode: articleCodes.get(key) ?? key, workOrderIds: [...workOrderIds] }]));
  const multiple = [...clusters.values()].filter((cluster) => cluster.workOrderIds.length > 1);
  return {
    clusters,
    multiWorkOrderArticles: multiple.length,
    workOrdersInMultipleArticles: multiple.reduce((total, cluster) => total + cluster.workOrderIds.length, 0),
  };
}

export function normalizeErpArticleKey(value: string): string {
  return value.trim().toLocaleUpperCase("fr");
}
