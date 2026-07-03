import { OrderStrategy } from './OrderStrategy';
import { PhysicalOrderStrategy } from './PhysicalOrderStrategy';
import { ServiceOrderStrategy } from './ServiceOrderStrategy';
import { DigitalOrderStrategy } from './DigitalOrderStrategy';
import { CourseOrderStrategy } from './CourseOrderStrategy';
import { ArtistOrderStrategy } from './ArtistOrderStrategy';
import { GenericOrderStrategy } from './GenericOrderStrategy';

export class OrderStrategyRegistry {
  private strategies = new Map<string, OrderStrategy>();
  private defaultStrategy: OrderStrategy = new GenericOrderStrategy();

  constructor() {
    this.register('physical', new PhysicalOrderStrategy());
    this.register('service', new ServiceOrderStrategy());
    this.register('digital', new DigitalOrderStrategy());
    this.register('course', new CourseOrderStrategy());
    this.register('artist', new ArtistOrderStrategy());
    this.register('generic', this.defaultStrategy);
  }

  register(type: string, strategy: OrderStrategy): void {
    this.strategies.set(type, strategy);
  }

  getStrategy(type: string): OrderStrategy {
    return this.strategies.get(type) || this.defaultStrategy;
  }
}

// Export singleton instance
export const orderStrategyRegistry = new OrderStrategyRegistry();
