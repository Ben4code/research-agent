import 'dotenv/config';
import {
  NativeConnection,
  Worker,
  Runtime,
  DefaultLogger,
} from '@temporalio/worker';
import * as activities from './activities/research.activities.js';

async function run() {
  Runtime.install({
    logger: new DefaultLogger('INFO'),
    telemetryOptions: {
      logging: {
        filter: { core: 'WARN', other: 'ERROR' },
        forward: {},
      },
    },
  });

  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE ?? 'default';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'research-agent';

  const [host, portStr] = temporalAddress.split(':');
  const connection = await NativeConnection.connect({
    address: `${host}:${portStr ?? '7233'}`,
  });

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
    connection,
    namespace: temporalNamespace,
  });

  console.log(`Temporal Worker starting...`);
  console.log(`  Address:    ${temporalAddress}`);
  console.log(`  Namespace:  ${temporalNamespace}`);
  console.log(`  Task Queue: ${taskQueue}`);

  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
