import {coralogixTransactionSampler} from "./trace";


const sdkNodeOriginalPath: string = require.resolve('@opentelemetry/sdk-node', {
            paths: [path.resolve(process.cwd(), 'node_modules')]
        });
const apiOriginalPath: string = require.resolve('@opentelemetry/api', {
            paths: [path.resolve(process.cwd(), 'node_modules')]
        });
const utilsOriginalPath: string = require.resolve('@opentelemetry/auto-instrumentations-node/utils', {
            paths: [path.resolve(process.cwd(), 'node_modules')]
        });

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const opentelemetry = require(sdkNodeOriginalPath);
// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
const {diag, DiagConsoleLogger} = require(apiOriginalPath);
const {
    getNodeAutoInstrumentations,
    getResourceDetectorsFromEnv,
// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
} = require(utilsOriginalPath);
import path from "node:path";

diag.setLogger(
    new DiagConsoleLogger(),
    opentelemetry.core.getEnv().OTEL_LOG_LEVEL
);

const sdk = new opentelemetry.NodeSDK({
    instrumentations: getNodeAutoInstrumentations(),
    resourceDetectors: getResourceDetectorsFromEnv(),
    sampler: coralogixTransactionSampler
});

try {
    sdk.start();
    diag.info('OpenTelemetry automatic instrumentation started successfully');
} catch (error) {
    diag.error(
        'Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry',
        error
    );
}

process.on('SIGTERM', () => {
    sdk
        .shutdown()
        .then(() => diag.debug('OpenTelemetry SDK terminated'))
        .catch((error: unknown) => diag.error('Error terminating OpenTelemetry SDK', error));
});
