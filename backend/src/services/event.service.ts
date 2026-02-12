import prisma from '../config/database';

// Domain event types
export type DomainEventType =
    | 'SESSION_STARTED'
    | 'CONSUMER_JOINED'
    | 'ORDER_PLACED'
    | 'ITEM_SHARED'
    | 'WAITER_CALLED'
    | 'BILL_REQUESTED'
    | 'SESSION_CLOSED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'TABLE_CREATED';

interface EventPayload {
    [key: string]: unknown;
}

export class EventService {
    static async publish(
        restaurantId: string,
        eventType: DomainEventType,
        payload: EventPayload
    ): Promise<void> {
        try {
            await prisma.domainEvent.create({
                data: {
                    restaurantId,
                    eventType,
                    payload: payload as object,
                },
            });
        } catch (error) {
            // Log error but don't fail the main operation
            console.error('Failed to publish domain event:', error);
        }
    }
}
