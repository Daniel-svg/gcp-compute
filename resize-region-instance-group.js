const {Buffer} = require('safe-buffer');
const compute = require('@google-cloud/compute');

exports.resizeInstances = (event, context, callback) => {
    try {
        const payload = _validatePayload(
            JSON.parse(Buffer.from(event.data, 'base64').toString())
        );
        main(payload);
    } catch (err) {
        console.log(err);
        callback(err);
    }
};

function main(data) {
    async function listAllInstances() {
        const instancesGMClient = new compute.RegionInstanceGroupManagersClient();

        const [response] = await instancesGMClient.resize({
            project: data.projectId,
            region: data.region,
            instanceGroupManager: data.instanceGroupName,
            size: data.size,
        });

        let operation = response.latestResponse;
        const operationsClient = new compute.RegionOperationsClient();

        // Wait for the resize operation to complete.
        while (operation.status !== 'Done') {
            [operation] = await operationsClient.wait({
                operation: operation.name,
                project: data.projectId,
                region: data.region
            });
        }
    }
    listAllInstances();
}

function _validatePayload(payload) {
    if (!payload.region) {
        throw new Error(`Attribute 'region' missing from payload`);
    } else if (!payload.projectId) {
        throw new Error(`Attribute 'projectId' missing from payload`);
    } else if (!payload.instanceGroupName) {
        throw new Error(`Attribute 'instanceGroupName' missing from payload`);
    }  else if (!payload.size) {
        throw new Error(`Attribute 'size' missing from payload`);
    }
    return payload;
}
