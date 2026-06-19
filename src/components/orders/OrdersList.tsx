import React from 'react';
import { Order, SortColumn, SortDirection } from '@/hooks/useOrders';
import { OrdersTable } from './OrdersTable';
import { OrderCard } from './OrderCard';
import { OrdersListVirtualized } from './OrdersListVirtualized';

type ViewMode = 'grid' | 'list';

interface OrdersListProps {
  orders: Order[];
  onUpdate: () => void;
  storeId: string;
  sortBy: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  viewMode?: ViewMode;
}

function MobileOrderCards({
  orders,
  onUpdate,
  storeId,
}: Pick<OrdersListProps, 'orders' | 'onUpdate' | 'storeId'>) {
  if (orders.length >= 20) {
    return (
      <OrdersListVirtualized
        orders={orders}
        onUpdate={onUpdate}
        storeId={storeId}
        itemHeight={240}
        containerHeight="min(70vh, 640px)"
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onUpdate={onUpdate} storeId={storeId} />
      ))}
    </div>
  );
}

const OrdersListComponent = ({
  orders,
  onUpdate,
  storeId,
  sortBy,
  sortDirection,
  onSort,
  viewMode = 'list',
}: OrdersListProps) => {
  return (
    <>
      {/* Mobile-first : cartes jusqu'à lg */}
      <div className="lg:hidden">
        <MobileOrderCards orders={orders} onUpdate={onUpdate} storeId={storeId} />
      </div>

      {/* Desktop : tableau ou grille selon viewMode */}
      <div className="hidden lg:block">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onUpdate={onUpdate} storeId={storeId} />
            ))}
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            onUpdate={onUpdate}
            storeId={storeId}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={onSort}
          />
        )}
      </div>
    </>
  );
};

export const OrdersList = React.memo(OrdersListComponent, (prevProps, nextProps) => {
  return (
    prevProps.orders.length === nextProps.orders.length &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.sortDirection === nextProps.sortDirection &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onSort === nextProps.onSort &&
    prevProps.orders.every(
      (order, index) =>
        order.id === nextProps.orders[index]?.id &&
        order.status === nextProps.orders[index]?.status &&
        order.total === nextProps.orders[index]?.total
    )
  );
});

OrdersList.displayName = 'OrdersList';
