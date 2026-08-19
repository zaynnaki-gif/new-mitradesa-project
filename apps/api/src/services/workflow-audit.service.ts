/**
 * Workflow Audit Service
 *
 * Provides structured audit logging for service document workflow events.
 * Uses the existing AuditLog model from the schema.
 */

import { prisma } from './prisma.js';
import { AuditAction, ActorType, Prisma } from '@prisma/client';

// ============================================================
// Workflow Event Types
// ============================================================

export type WorkflowEvent =
  | 'REQUEST_CREATED'
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_PROCESSING'
  | 'REQUEST_REVIEWED'
  | 'REQUEST_REVISION'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_CANCELLED'
  | 'DOCUMENT_GENERATED'
  | 'DOCUMENT_SIGNED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_ARCHIVED';

// ============================================================
// Mapping to AuditAction enum
// ============================================================

const WORKFLOW_EVENT_TO_ACTION: Record<WorkflowEvent, AuditAction> = {
  REQUEST_CREATED: 'CREATE',
  REQUEST_SUBMITTED: 'UPDATE',
  REQUEST_PROCESSING: 'UPDATE',
  REQUEST_REVIEWED: 'UPDATE',
  REQUEST_REVISION: 'UPDATE',
  REQUEST_APPROVED: 'UPDATE',
  REQUEST_REJECTED: 'UPDATE',
  REQUEST_COMPLETED: 'UPDATE',
  REQUEST_CANCELLED: 'UPDATE',
  DOCUMENT_GENERATED: 'CREATE',
  DOCUMENT_SIGNED: 'CREATE',
  DOCUMENT_VERIFIED: 'UPDATE',
  DOCUMENT_ARCHIVED: 'UPDATE',
};

// ============================================================
// Audit Service
// ============================================================

export class WorkflowAuditService {
  /**
   * Log a workflow event
   */
  async log(
    event: WorkflowEvent,
    entityType: string,
    entityId: bigint,
    options?: {
      actorId?: bigint;
      actorType?: ActorType;
      actorIp?: string;
      actorAgent?: string;
      beforeData?: Record<string, unknown>;
      afterData?: Record<string, unknown>;
      reason?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const {
      actorId,
      actorType = ActorType.USER,
      actorIp,
      actorAgent,
      beforeData,
      afterData,
      reason,
      metadata,
    } = options || {};

    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action: WORKFLOW_EVENT_TO_ACTION[event],
        actorId,
        actorType,
        actorIp,
        actorAgent,
        beforeData: beforeData as Prisma.InputJsonValue | undefined,
        afterData: afterData as Prisma.InputJsonValue | undefined,
        reason,
        metadata: {
          event,
          ...metadata,
        } as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Log request created
   */
  async logRequestCreated(
    requestId: bigint,
    actorId: bigint,
    requestData: Record<string, unknown>,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_CREATED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      afterData: requestData,
    });
  }

  /**
   * Log request submitted
   */
  async logRequestSubmitted(
    requestId: bigint,
    actorId: bigint,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_SUBMITTED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log request processing
   */
  async logRequestProcessing(
    requestId: bigint,
    actorId: bigint,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_PROCESSING', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log request approved
   */
  async logRequestApproved(
    requestId: bigint,
    actorId: bigint,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_APPROVED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log request rejected
   */
  async logRequestRejected(
    requestId: bigint,
    actorId: bigint,
    reason?: string,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_REJECTED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      reason,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log request completed
   */
  async logRequestCompleted(
    requestId: bigint,
    actorId: bigint,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_COMPLETED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log request cancelled
   */
  async logRequestCancelled(
    requestId: bigint,
    actorId: bigint,
    reason?: string,
    actorIp?: string
  ): Promise<void> {
    await this.log('REQUEST_CANCELLED', 'PermintaanLayanan', requestId, {
      actorId,
      actorIp,
      reason,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log document generated
   */
  async logDocumentGenerated(
    documentId: bigint,
    actorId: bigint,
    documentData: Record<string, unknown>,
    actorIp?: string
  ): Promise<void> {
    await this.log('DOCUMENT_GENERATED', 'InstanDokumen', documentId, {
      actorId,
      actorIp,
      afterData: documentData,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  /**
   * Log document signed
   */
  async logDocumentSigned(
    documentId: bigint,
    actorId: bigint,
    signatoryId: bigint,
    actorIp?: string
  ): Promise<void> {
    await this.log('DOCUMENT_SIGNED', 'InstanDokumen', documentId, {
      actorId,
      actorIp,
      metadata: {
        timestamp: new Date().toISOString(),
        signatoryId: signatoryId.toString(),
      },
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: bigint,
    limit: number = 50
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit trail for a request
   */
  async getRequestAuditTrail(requestId: bigint, limit: number = 50) {
    return this.getAuditTrail('PermintaanLayanan', requestId, limit);
  }

  /**
   * Get audit trail for a document
   */
  async getDocumentAuditTrail(documentId: bigint, limit: number = 50) {
    return this.getAuditTrail('InstanDokumen', documentId, limit);
  }
}

// Export singleton instance
export const workflowAuditService = new WorkflowAuditService();
