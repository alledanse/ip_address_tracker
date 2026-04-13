import { describe, it, expect, vi, beforeEach } from 'vitest';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({ setView: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn() })),
    icon: vi.fn(),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  },
}));

describe('IP Tracker Tests', () => {
  let ipInput, btn, ipInfo, locationInfo, timezoneInfo, ispInfo;
  let validateIpMock, getAddressMock, addOffsetsMock;

  beforeEach(async () => {
    document.body.innerHTML = `
      <input class="search-bar__input" />
      <button class="search-bar__btn"></button>
      <div id="ip"></div>
      <div id="location"></div>
      <div id="timezone"></div>
      <div id="isp"></div>
      <div class="map"></div>
    `;

    ipInput = document.querySelector('.search-bar__input');
    btn = document.querySelector('.search-bar__btn');
    ipInfo = document.querySelector('#ip');
    locationInfo = document.querySelector('#location');
    timezoneInfo = document.querySelector('#timezone');
    ispInfo = document.querySelector('#isp');

    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    // Создаём свежие моки для каждого теста
    validateIpMock = vi.fn();
    getAddressMock = vi.fn().mockResolvedValue();
    addOffsetsMock = vi.fn();

    vi.resetModules(); // сбрасываем кэш модулей

    // doMock работает без hoisting, вызывается после resetModules
    vi.doMock('../src/helpers/index.js', () => ({
      addTileLayer: vi.fn(),
      validateIp: validateIpMock,
      getAddress: getAddressMock,
      addOffsets: addOffsetsMock,
    }));

    await import('../src/index.js');
  });

  it('should call getAddress when valid IP is entered and button clicked', async () => {
    validateIpMock.mockReturnValue(true);
    getAddressMock.mockResolvedValue({});

    ipInput.value = '1.1.1.1';
    btn.click();

    expect(validateIpMock).toHaveBeenCalledWith('1.1.1.1');
    expect(getAddressMock).toHaveBeenCalled();
  });

  it('should not call getAddress when IP is invalid', async () => {
    validateIpMock.mockReturnValue(false);

    ipInput.value = 'invalid';
    btn.click();

    expect(getAddressMock).not.toHaveBeenCalled();
  });

  it('should trigger search on Enter key', async () => {
    validateIpMock.mockReturnValue(true);
    getAddressMock.mockResolvedValue({});

    ipInput.value = '1.1.1.1';
    ipInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(getAddressMock).toHaveBeenCalled();
  });

  it('should set DOM info correctly', async () => {
    validateIpMock.mockReturnValue(true);

    const mockData = {
      ip: '1.1.1.1',
      isp: 'Test ISP',
      location: { lat: 10, lng: 20, country: 'Country', region: 'Region', timezone: 'UTC+1' },
    };

    getAddressMock.mockResolvedValue(mockData);

    ipInput.value = '1.1.1.1';
    btn.click();

    await flushPromises();

    expect(ipInfo.innerText).toBe('1.1.1.1');
    expect(locationInfo.innerText).toBe('Country Region');
    expect(timezoneInfo.innerText).toBe('UTC+1');
    expect(ispInfo.innerText).toBe('Test ISP');
  });

  it('should call addOffsets on small screens', async () => {
    validateIpMock.mockReturnValue(true);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    const mockData = {
      ip: '1.1.1.1',
      isp: 'Test ISP',
      location: { lat: 10, lng: 20, country: 'Country', region: 'Region', timezone: 'UTC+1' },
    };

    getAddressMock.mockResolvedValue(mockData);

    ipInput.value = '1.1.1.1';
    btn.click();

    await flushPromises();

    expect(addOffsetsMock).toHaveBeenCalled();
  });

  it('should load default IP on DOMContentLoaded', async () => {
    getAddressMock.mockResolvedValue({
      ip: '102.22.22.1',
      isp: 'Test ISP',
      location: { lat: 0, lng: 0, country: 'Country', region: 'Region', timezone: 'UTC' },
    });

    document.dispatchEvent(new Event('DOMContentLoaded'));

    await flushPromises();

    expect(getAddressMock).toHaveBeenCalledWith('102.22.22.1');
  });
});
