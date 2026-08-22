import {
  formatServiceDurationMinutes,
  serviceLocationTypeLabel,
  serviceTypeLabel,
} from '../service-detail-labels';

describe('service-detail-labels', () => {
  it('hides empty or zero duration', () => {
    expect(formatServiceDurationMinutes(undefined)).toBeNull();
    expect(formatServiceDurationMinutes(0)).toBeNull();
  });

  it('formats minutes and hours', () => {
    expect(formatServiceDurationMinutes(45)).toBe('45 min');
    expect(formatServiceDurationMinutes(60)).toBe('1 h');
    expect(formatServiceDurationMinutes(90)).toBe('1 h 30 min');
  });

  it('maps location and service types', () => {
    expect(serviceLocationTypeLabel('online')).toBe('En ligne');
    expect(serviceLocationTypeLabel('on_site')).toBe('Sur site');
    expect(serviceTypeLabel('other')).toBe('Prestation');
    expect(serviceTypeLabel('appointment')).toBe('Rendez-vous');
  });
});
