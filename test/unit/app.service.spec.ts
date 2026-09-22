import { AppService } from '../../src/app.service.js';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  it('should return "Hello World!"', () => {
    expect(appService.getHello()).toBe('Hello World!');
  });
});
