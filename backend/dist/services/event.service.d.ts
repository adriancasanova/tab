export type DomainEventType = 'SESSION_STARTED' | 'CONSUMER_JOINED' | 'ORDER_PLACED' | 'ITEM_SHARED' | 'WAITER_CALLED' | 'BILL_REQUESTED' | 'SESSION_CLOSED' | 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'TABLE_CREATED';
interface EventPayload {
    [key: string]: unknown;
}
export declare class EventService {
    static publish(restaurantId: string, eventType: DomainEventType, payload: EventPayload): Promise<void>;
}
export {};
//# sourceMappingURL=event.service.d.ts.map