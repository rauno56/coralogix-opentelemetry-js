# Coralogix Opentelemetry

## Flows With Express
To use coralogix flows with express you must use the `setExpressApp`
function to make sure that the `coralogix sampler` understands
your routes and endpoints.

Example:

```javascript
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { CoralogixTransactionSampler } from '@coralogix/opentelemetry';
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const sampler = new CoralogixTransactionSampler();

const tracerProvider = new BasicTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: '<your-service-name>'
    }),
    sampler
});

import express from "express";

const router = express.Router()

const app = express();
app.use('/', router);

sampler.setExpressApp(app);

app.listen(3000, () => {
    console.log('Server is running')
});
```
