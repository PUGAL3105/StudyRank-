import db, { memoryStore } from '../db/connection'

export interface AuditLogItem {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  metadata?: any
  ip_address?: string
  created_at: string
}

export async function logAuditAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: any,
  ipAddress?: string
): Promise<AuditLogItem> {
  const item: AuditLogItem = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    ip_address: ipAddress || '127.0.0.1',
    created_at: new Date().toISOString(),
  }

  memoryStore.auditLogs.unshift(item)

  try {
    await db.none(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [item.id, userId, action, resourceType, resourceId, JSON.stringify(metadata || {}), item.ip_address]
    )
  } catch {
    // Ignore fallback db error
  }

  return item
}

export async function getAuditLogs(): Promise<AuditLogItem[]> {
  try {
    const rows = await db.manyOrNone(
      `SELECT a.id, a.user_id, a.action, a.resource_type, a.resource_id, a.metadata, a.ip_address, a.created_at, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100`
    )
    if (rows && rows.length > 0) return rows
  } catch {
    // Return memory fallback
  }

  return memoryStore.auditLogs
}
