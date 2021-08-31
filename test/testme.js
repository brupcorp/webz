const webz = require('../lib');

const {server} = webz({ routeFolder: './test/routes'});

server.listen(3000);