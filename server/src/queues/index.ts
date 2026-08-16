import { Queue } from 'bullmq';
import { config } from '../config';

const connection = {
  url: config.redisUrl
};

export const taskQueue = new Queue('task-queue', { connection });

export const initQueues = async () => {
  await taskQueue.add('check-deadlines', {}, {
    repeat: {
      pattern: '* * * * *' 
    }
  } as any);
};
