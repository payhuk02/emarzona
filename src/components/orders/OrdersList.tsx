import React from "react";
import { Order } from "@/hooks/useOrders";
import { SortColumn, SortDirection } from "@/hooks/useOrders";
import { OrdersTable } from "./OrdersTable";
import { OrderCard } from "./OrderCard";
import { OrdersListVirtualized } from "./OrdersListVirtualized";

interface OrdersListProps {
  orders: Order[];
  onUpdate: () => void;
  storeId: string;
  sortBy: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

const OrdersListComponent = ({
  orders,
  onUpdate,
  storeId,
  sortBy,
  sortDirection,
  onSort,
}: OrdersListProps) => {
  return (
    <>
      {/* Desktop/Tablet: Table View (hidden on mobile) */}
      <div className="hidden md:block">
        <OrdersTable
          orders={orders}
          onUpdate={onUpdate}
          storeId={storeId}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      </div>

      {/* Mobile: Card View (hidden on desktop/tablet) */}
      <div className="md:hidden">
        {orders.length >= 20 ? (
          <OrdersListVirtualized
            orders={orders}
            onUpdate={onUpdate}
            storeId={storeId}
            itemHeight={200}
            containerHeight="calc(100vh - 300px)"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdate={onUpdate}
                storeId={storeId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrdersList = React.memo(OrdersListComponent, (prevProps, nextProps) => {
  return (
    prevProps.orders.length === nextProps.orders.length &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.sortDirection === nextProps.sortDirection &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onSort === nextProps.onSort &&
    // Comparaison superficielle des orders (comparer les IDs)
    prevProps.orders.every((order, index) => 
      order.id === nextProps.orders[index]?.id &&
      order.status === nextProps.orders[index]?.status &&
      order.total === nextProps.orders[index]?.total
    )
  );
});

OrdersList.displayName = 'OrdersList';







