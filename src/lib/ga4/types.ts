/**
 * GA4 API types
 */

export interface GA4AccountSummary {
  name: string; // "accountSummaries/123456"
  account: string; // "accounts/123456"
  displayName: string;
  propertySummaries?: GA4PropertySummary[];
}

export interface GA4PropertySummary {
  property: string; // "properties/987654321"
  displayName: string;
  propertyType?: string;
  parent?: string; // "accounts/123456"
}

export interface GA4AccountSummariesResponse {
  accountSummaries?: GA4AccountSummary[];
  nextPageToken?: string;
}

export interface GA4Dimension {
  name: string;
}

export interface GA4Metric {
  name: string;
}

export interface GA4DateRange {
  startDate: string;
  endDate: string;
  name?: string;
}

export interface GA4MinuteRange {
  name?: string;
  startMinutesAgo?: number;
  endMinutesAgo?: number;
}

export interface GA4FilterExpression {
  filter?: {
    fieldName: string;
    stringFilter?: {
      matchType: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "FULL_REGEXP" | "PARTIAL_REGEXP";
      value: string;
      caseSensitive?: boolean;
    };
    numericFilter?: {
      operation: "EQUAL" | "LESS_THAN" | "LESS_THAN_OR_EQUAL" | "GREATER_THAN" | "GREATER_THAN_OR_EQUAL";
      value: { int64Value?: string; doubleValue?: number };
    };
    inListFilter?: {
      values: string[];
      caseSensitive?: boolean;
    };
  };
  andGroup?: { expressions: GA4FilterExpression[] };
  orGroup?: { expressions: GA4FilterExpression[] };
  notExpression?: GA4FilterExpression;
}

export interface GA4OrderBy {
  metric?: { metricName: string };
  dimension?: { dimensionName: string; orderType?: string };
  desc?: boolean;
}

export interface GA4RunReportRequest {
  dateRanges?: GA4DateRange[];
  dimensions?: GA4Dimension[];
  metrics?: GA4Metric[];
  dimensionFilter?: GA4FilterExpression;
  metricFilter?: GA4FilterExpression;
  orderBys?: GA4OrderBy[];
  limit?: string;
  offset?: string;
  keepEmptyRows?: boolean;
  returnPropertyQuota?: boolean;
}

export interface GA4DimensionValue {
  value: string;
}

export interface GA4MetricValue {
  value: string;
}

export interface GA4Row {
  dimensionValues?: GA4DimensionValue[];
  metricValues?: GA4MetricValue[];
}

export interface GA4PropertyQuota {
  tokensPerDay?: { consumed: number; remaining: number };
  tokensPerHour?: { consumed: number; remaining: number };
  concurrentRequests?: { consumed: number; remaining: number };
}

export interface GA4RunReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type: string }>;
  rows?: GA4Row[];
  rowCount?: number;
  metadata?: Record<string, unknown>;
  propertyQuota?: GA4PropertyQuota;
}

export interface GA4RealtimeReportRequest {
  dimensions?: GA4Dimension[];
  metrics?: GA4Metric[];
  limit?: string;
  minuteRanges?: GA4MinuteRange[];
}

/** Simplified filter shorthand that tools can accept from AI */
export interface GA4FilterShorthand {
  fieldName: string;
  matchType?: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "FULL_REGEXP" | "PARTIAL_REGEXP";
  value?: string;
  values?: string[];
}
