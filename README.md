node-red-contrib-docloud-api
=====================


<a href="http://nodered.org" target="_new">Node-RED</a> nodes to integrate **optimization service** into your application.

Pre-requisite
-------------

To run this you need a subscription on <a href="http://www.ibm.com/software/analytics/docloud">IBM Decision Optimization on Cloud</a>. For details see <a href="http://www.ibm.com/software/analytics/docloud">IBM Decision Optimization on Cloud</a>.

IBM Decision Optimization on Cloud
-------------

<a href="http://www.ibm.com/software/analytics/docloud">IBM Decision Optimization on Cloud</a> or DOcloud for short is a service 
that lets you solve CPLEX and OPL problems on the Cloud. You can access the interactive service called DropSolve or you can 
use the API to integrate the service into your application. Here is a quick introduction with useful links. This module 
provides a wrapper over the REST API using Promises. The command line client for DOcloud is also a good tool and example 
showing how to use this API.


Install
-------

Run the following command in the root directory of your Node-RED install.

        npm install node-red-contrib-docloud-api

Usage
-----

Access <a href="http://www.ibm.com/software/analytics/docloud">IBM Decision Optimization on Cloud</a> service.

### docloud config

You can find your base URL and API key from Developer -> Get your API Key & base URL link

- **url** property: the base URL
- **key** property: your API Key,

### 'docloud default config' node

You can define a configuaration for each docloud node. If you don't specify a special configuartion for your docloud node, the default one will be used, which is defined in the 'docloud default config' node.

### 'docloud' node

You can do 3 operations:

- execute
- create
- submit

Check info panel in Node-RED admin console for detailed documents

This nodes emits following events:

- CREATED
- PROCESSED
- INTERRUPTED
- FAILED
- ERROR

You can use 'docloud event' node to catch them.


### 'docloud job' node

You can do following operations:

- list jobs
- delete jobs
- get job
- delete job
- abort job
- get job execution status
- upload attachment
- download attachment
- get log items
- download log


