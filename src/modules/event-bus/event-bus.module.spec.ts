import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBusModule } from './event-bus.module';

describe('EventBusModule', () => {
  let moduleRef: TestingModule;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventBusModule],
    }).compile();

    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should provide EventEmitter2', () => {
    expect(eventEmitter).toBeDefined();
    expect(typeof eventEmitter.emit).toBe('function');
  });

  it('should emit and listen to a namespaced event', async () => {
    const handler = jest.fn();
    eventEmitter.on('test.event', handler);

    eventEmitter.emit('test.event', { hello: 'world' });

    expect(handler).toHaveBeenCalledWith({ hello: 'world' });
  });

  it('should support wildcard listeners', async () => {
    const handler = jest.fn();
    eventEmitter.on('wildcard.*', handler);

    eventEmitter.emit('wildcard.fired', { value: 1 });

    expect(handler).toHaveBeenCalled();
  });
});
