To run the node please type `node .`. The code for the RESTful API is located in app.js. 

The selected API framework is **express.js**

Two endpoints have been defined:

- **GET** Block endpoint using URL path with block height parameter 

For example typing in the browser `http://localhost:8000/block/0` the returned block is:

`{"hash":"ac467e09c28b82954257f67a6f47f998c665c4aaffe0494acc5024dbae2ac6c1","height":0,"body":"First block in the chain - Genesis block","time":"1534280487","previousBlockHash":""}`


- **POST** Block endpoint using key/value pair within request body and URL `http://localhost:8000/block/`

The endpoint has been tested with Postman.
