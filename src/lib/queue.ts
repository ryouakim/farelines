import { getWorkerQueueCollection, getTripsCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { Trip, WorkerQueue } from '@/types/trip'

/**
 * Add a trip to the worker queue for processing
 */
export async function enqueueTripCheck(
  tripId: string | ObjectId, 
  reason: 'created' | 'updated' | 'manual_check' = 'updated',
  priority: number = 2
) {
  try {
    const queue = await getWorkerQueueCollection()
    
    // Check if this trip is already in the queue
    const existing = await queue.findOne({
      tripId: tripId.toString(),
      status: 'pending'
    })
    
    if (existing) {
      // Update priority if the new one is higher (lower number = higher priority)
      if (priority < existing.priority) {
        await queue.updateOne(
          { _id: existing._id },
          { $set: { priority, updatedAt: new Date() } }
        )
      }
      return existing._id
    }
    
    // Add new queue item
    const result = await queue.insertOne({
      tripId: tripId.toString(),
      reason,
      priority,
      attempts: 0,
      status: 'pending',
      createdAt: new Date()
    })
    
    return result.insertedId
  } catch (error) {
    console.error('Error enqueuing trip check:', error)
    throw error
  }
}

/**
 * Mark a trip as checked and update with latest data
 * This is called by the worker after checking prices
 */
export async function markTripChecked(
  tripId: string | ObjectId,
  data: {
    lastCheckedPrice?: number
    current_fare?: number
    lowestSeen?: number
    lastCheckedFares?: Record<string, number>
    lowestSeenByFareType?: Record<string, number>
    lastCheckAlerts?: any[]
    error?: string
  }
) {
  try {
    const trips = await getTripsCollection()
    const queue = await getWorkerQueueCollection()
    
    // Update the trip with the latest data
    const updateData: any = {
      lastCheckedAt: new Date(),
      needsCheck: false,
      updatedAt: new Date()
    }
    
    // Add provided fields
    if (data.lastCheckedPrice !== undefined) updateData.lastCheckedPrice = data.lastCheckedPrice
    if (data.current_fare !== undefined) updateData.current_fare = data.current_fare
    if (data.lowestSeen !== undefined) updateData.lowestSeen = data.lowestSeen
    if (data.lastCheckedFares) updateData.lastCheckedFares = data.lastCheckedFares
    if (data.lowestSeenByFareType) updateData.lowestSeenByFareType = data.lowestSeenByFareType
    if (data.lastCheckAlerts) updateData.lastCheckAlerts = data.lastCheckAlerts
    
    await trips.updateOne(
      { _id: new ObjectId(tripId) },
      { $set: updateData }
    )
    
    // Mark the queue item as completed
    await queue.updateMany(
      { 
        tripId: tripId.toString(),
        status: { $in: ['pending', 'processing'] }
      },
      { 
        $set: { 
          status: data.error ? 'failed' : 'completed',
          processedAt: new Date(),
          error: data.error
        }
      }
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error marking trip as checked:', error)
    throw error
  }
}

/**
 * Get pending trips from the queue for the worker to process
 */
export async function getPendingTrips(limit: number = 10): Promise<Trip[]> {
  try {
    const queue = await getWorkerQueueCollection()
    const trips = await getTripsCollection()
    
    // Get pending queue items ordered by priority and creation time
    const pendingItems = await queue
      .find({ status: 'pending' })
      .sort({ priority: 1, createdAt: 1 })
      .limit(limit)
      .toArray()
    
    if (pendingItems.length === 0) {
      return []
    }
    
    // Mark them as processing
    const queueIds = pendingItems.map(item => item._id)
    await queue.updateMany(
      { _id: { $in: queueIds } },
      { 
        $set: { 
          status: 'processing',
          $inc: { attempts: 1 }
        }
      }
    )
    
    // Get the corresponding trips
    const tripIds = pendingItems.map(item => new ObjectId(item.tripId))
    const tripsToProcess = await trips
      .find({ _id: { $in: tripIds } })
      .toArray()
    
    return tripsToProcess as Trip[]
  } catch (error) {
    console.error('Error getting pending trips:', error)
    return []
  }
}

/**
 * Clean up old completed queue items
 */
export async function cleanupQueue(daysToKeep: number = 7) {
  try {
    const queue = await getWorkerQueueCollection()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await queue.deleteMany({
      status: 'completed',
      processedAt: { $lt: cutoffDate }
    })
    
    console.log(`Cleaned up ${result.deletedCount} old queue items`)
    return result.deletedCount
  } catch (error) {
    console.error('Error cleaning up queue:', error)
    return 0
  }
}

/**
 * Reset failed queue items for retry
 */
export async function resetFailedItems(maxAttempts: number = 3) {
  try {
    const queue = await getWorkerQueueCollection()
    
    // Reset items that haven't exceeded max attempts
    const result = await queue.updateMany(
      {
        status: 'failed',
        attempts: { $lt: maxAttempts }
      },
      {
        $set: { 
          status: 'pending',
          error: null
        }
      }
    )
    
    console.log(`Reset ${result.modifiedCount} failed queue items for retry`)
    return result.modifiedCount
  } catch (error) {
    console.error('Error resetting failed items:', error)
    return 0
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const queue = await getWorkerQueueCollection()
    
    const stats = await queue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgAttempts: { $avg: '$attempts' }
        }
      }
    ]).toArray()
    
    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    }
    
    stats.forEach(stat => {
      result[stat._id as keyof typeof result] = stat.count
      result.total += stat.count
    })
    
    return result
  } catch (error) {
    console.error('Error getting queue stats:', error)
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    }
  }
}
