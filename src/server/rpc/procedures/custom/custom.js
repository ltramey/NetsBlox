// This is a service which enables users to create custom RPCs and stores them
// under the given name

const Logger = require('../../../logger');
const logger = new Logger('netsblox:rpc:custom');

const Storage = require('../../storage');
let _storage = null;
const storage = () => _storage = _storage || Storage.create('user-rpcs');

const Custom = {
    isStateless: true,
    getPath: () => '/custom',
    createRPC: function(name, code) {
        const response = this.response;
        let projectId;

        // create the function from the blocks
        // TODO
        const compiled = null;
        logger.trace(`compiled ${name} for ${projectId}`);

        // store the fn for the given user
        return this.socket.getRoom()
            .then(room => {
                projectId = room.uuid;
                return storage().get(projectId);
            })
            .then(rpcs => {
                rpcs = rpcs || {};
                rpcs[name] = compiled;
                return storage().save(projectId, rpcs);
            })
            .then(() => {
                logger.trace(`saved ${name} for ${projectId}`);
                response.send('ok');
            });
    },

    destroyRPC: function(name) {
        const response = this.response;
        let projectId;

        // delete the given item from 
        return this.socket.getRoom()
            .then(room => {
                projectId = room.uuid;
                return storage().get(projectId);
            })
            .then(rpcs => {
                rpcs = rpcs || {};
                delete rpcs[name];
                return storage().save(projectId, rpcs);
            })
            .then(() => {
                logger.trace(`deleted ${name} for ${projectId}`);
                response.send('ok');
            });
    }
};

module.exports = Custom;
