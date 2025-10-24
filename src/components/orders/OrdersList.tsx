import { Order } from "@/hooks/useOrders";
import { SortColumn, SortDirection } from "@/hooks/useOrders";
import { OrdersTable } from "./OrdersTable";
import { OrderCard } from "./OrderCard";

interface OrdersListProps {
  orders: Order[];
  onUpdate: () => void;
  storeId: string;
  sortBy: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export const OrdersList = ({
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
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdate={onUpdate}
            storeId={storeId}
          />
        ))}
      </div>
    </>
  );
};

