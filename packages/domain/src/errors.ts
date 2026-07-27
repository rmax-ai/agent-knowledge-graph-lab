export class KnowledgeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeValidationError";
  }
}

export class KnowledgeNotFoundError extends Error {
  constructor(entityId: string) {
    super(`Knowledge entity not found: ${entityId}`);
    this.name = "KnowledgeNotFoundError";
  }
}

export class GraphBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphBuildError";
  }
}

export class GraphQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphQueryError";
  }
}

export class AgentExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentExecutionError";
  }
}

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}

export class ToolLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolLimitError";
  }
}

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationError";
  }
}
