import * as fs from 'fs';
import * as path from 'path';
import {coralogixTransactionSampler} from "./trace";


function modifyAndLoadRegisterFile(): void {
    try {
        console.log('Starting the process to modify and load the OpenTelemetry register file...');
        console.log('cwd: ', process.cwd());
        // Step 1: Resolve the path to the original register file from the importing project's node_modules
        const originalRegisterPath: string = require.resolve('@opentelemetry/auto-instrumentations-node/register', {
            paths: [path.resolve(process.cwd(), 'node_modules')]
        });
        console.log(`Resolved path to the original register file: ${originalRegisterPath}`);

        // Step 2: Read the original file content
        let fileContent: string = fs.readFileSync(originalRegisterPath, 'utf8');
        console.log('Original register file content successfully read.');

        // Step 3: Add the import statement for CoralogixTransactionSampler
        const importStatement = `const { coralogixTransactionSampler } = require('${path.resolve(process.cwd(), 'node_modules/@coralogix/opentelemetry/dist/index.js')}');\n`;
        fileContent = importStatement + fileContent;

        // Step 4: Modify the file content to inject the custom sampler
        console.log('Attempting to modify the file content...');
        const modifiedContent = fileContent.replace(
            /new opentelemetry\.NodeSDK\({/,
            `new opentelemetry.NodeSDK({
            sampler: coralogixTransactionSampler,`
        );

        // Check if the replacement was successful
        if (modifiedContent === fileContent) {
            console.warn('No changes were made to the file content. The pattern might not have been found.');
        } else {
            console.log('File content modified successfully.');
        }

        // Step 5: Create a temporary file in the same directory as the original register file
        const originalDir = path.dirname(originalRegisterPath);
        const tempFilePath = path.join(originalDir, 'temp_register.js');
        fs.writeFileSync(tempFilePath, modifiedContent, 'utf8');
        console.log(`Modified file content with CoralogixTransactionSampler import written to temporary file: ${tempFilePath}`);

        // Step 6: Require the modified file
        console.log('Attempting to require the modified file...');
        require(tempFilePath);
        console.log('Modified file successfully required and executed.');

        // Optionally, remove the temporary file after loading it
        console.log('Cleaning up temporary file...');
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file removed.');

        console.log('Custom OpenTelemetry instrumentation started successfully.');

    } catch (error) {
        console.error("Error modifying or loading the OpenTelemetry SDK:\nMake sure to have @opentelemetry/auto-instrumentations-node installed in the project.\n", error);
    }
}

function patchExpressListenFunction(): void {
    try {
        console.log('Starting the process to patch the Express listen function...');

        // Step 1: Dynamically resolve the path to the Express module from the importing project's node_modules
        const expressPath: string = require.resolve('express', {
            paths: [path.resolve(process.cwd(), 'node_modules')]
        });
        console.log(`Resolved path to Express module: ${expressPath}`);

        // Step 2: Dynamically require the Express module to get the application prototype
        const express = require(expressPath);
        console.log('Express module loaded dynamically.');

        // Step 3: Access the application prototype
        const application = express.application;

        // Step 4: Store the original listen function
        const originalListen = application.listen;

        // Step 5: Patch the listen function to inject custom logic
        application.listen = function (...args: any[]) {
            console.log('Patching the listen function with Coralogix Transaction Sampler...');

            // Inject the custom logic to set the Express app
            coralogixTransactionSampler.setExpressApp(this);

            console.log('Custom logic added. Now calling the original listen function...');

            // Call the original listen function with the provided arguments
            return originalListen.apply(this, args);
        };

        console.log('Express application listen function patched successfully.');

    } catch (error) {
        console.error('Error patching the Express listen function:', error);
    }
}

// Execute the function to patch the listen function
patchExpressListenFunction();

modifyAndLoadRegisterFile();
